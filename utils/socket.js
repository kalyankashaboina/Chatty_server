const { verifyToken, getTokenFromCookies } = require('./auth');
const { addUser, removeUser, getOnlineUsers, getSocketIdByUserId } = require('./onlineUsers');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { addMessageToQueue } = require('./messageQueue');
const Message = require('../models/Message');
const logger = require('./logger');

const handleSocketConnection = io => {
  io.on('connection', socket => {
    let token = getTokenFromCookies(socket.request);
    logger.info('🔑 Token from cookies:', token);
    if (!token) {
      logger.info('❌ No token, disconnecting socket');
      return socket.disconnect();
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        logger.info('❌ Invalid token');
        return socket.disconnect();
      }

      const userId = decoded.userId;
      socket.userId = userId;

      // Add the user to the online users
      addUser(userId, socket.id);

      try {
        await User.findByIdAndUpdate(userId, { isOnline: true });
      } catch (e) {
        logger.error('❌ Error updating user online status:', e);
      }

      // Log current online users
      logger.info(
        '🔑 Current online users after connection:',
        JSON.stringify(getOnlineUsers(), null, 2)
      );

      // Broadcast user online status to others
      socket.broadcast.emit('userOnline', { userId });
      logger.info(`✅ User ${userId} connected (Socket ID: ${socket.id})`);

      // Video call feature - Offer
      socket.on('offer', (offer, recipientId) => {
        logger.info(`📞 Offer received from ${socket.userId} to ${recipientId}`);
        const recipientSocketId = getSocketIdByUserId(recipientId);
        if (recipientSocketId.length > 0) {
          recipientSocketId.forEach(sid => io.to(sid).emit('offer', offer, socket.userId));
        }
      });

      // Video call feature - Answer
      socket.on('answer', (answer, recipientId) => {
        logger.info(`📞 Answer received from ${socket.userId} to ${recipientId}`);
        const recipientSocketId = getSocketIdByUserId(recipientId);
        if (recipientSocketId.length > 0) {
          recipientSocketId.forEach(sid => io.to(sid).emit('answer', answer, socket.userId));
        }
      });

      // Video call feature - ICE Candidate
      socket.on('ice-candidate', (candidate, recipientId) => {
        logger.info(`📞 ICE candidate received from ${socket.userId} to ${recipientId}`);
        const recipientSocketId = getSocketIdByUserId(recipientId);
        if (recipientSocketId.length > 0) {
          recipientSocketId.forEach(sid =>
            io.to(sid).emit('ice-candidate', candidate, socket.userId)
          );
        }
      });

      // Typing and stopped typing events
      socket.on('typing', ({ recipientId }) => {
        const recipientSockets = getSocketIdByUserId(recipientId);
        if (recipientSockets.length > 0) {
          recipientSockets.forEach(sid => io.to(sid).emit('typing', { senderId: userId }));
        }
      });

      socket.on('stoppedTyping', ({ recipientId }) => {
        const recipientSockets = getSocketIdByUserId(recipientId);
        if (recipientSockets.length > 0) {
          recipientSockets.forEach(sid => io.to(sid).emit('stoppedTyping', { senderId: userId }));
        }
      });

      // Sending messages
      socket.on('sendMessage', data => {
        const { recipientId, content, type = null, mediaUrl = null } = data;
        const senderId = userId;
        const recipientSockets = getSocketIdByUserId(recipientId);

        if (mediaUrl) logger.info('🌐 Media URL:', mediaUrl);

        addMessageToQueue({
          sender: senderId,
          recipient: recipientId,
          content,
          type,
          mediaUrl,
          timestamp: new Date(),
        });

        // Log current online users before sending the message
        logger.info(
          '🔑 Current online users before sending message:',
          JSON.stringify(getOnlineUsers(), null, 2)
        );

        if (recipientSockets.length > 0) {
          recipientSockets.forEach(sid => {
            io.to(sid).emit('message', {
              senderId,
              type,
              content,
              mediaUrl,
            });
          });
          logger.info('✅ Message delivered');
        } else {
          logger.info('⚠️ Recipient offline. Message queued.');
        }
      });

      // Fetch recent messages between users
      socket.on('getRecentMessages', async otherUserId => {
        try {
          const messages = await Message.find({
            $or: [
              { sender: userId, recipient: otherUserId },
              { sender: otherUserId, recipient: userId },
            ],
          })
            .sort({ timestamp: -1 })
            .limit(20)
            .lean();

          socket.emit('recentMessages', messages.reverse());
        } catch (err) {
          logger.error('❌ Error fetching recent messages:', err);
        }
      });

      // Disconnect handling
      socket.on('disconnect', async () => {
        removeUser(userId, socket.id);

        const remainingSockets = getSocketIdByUserId(userId);
        if (remainingSockets.length === 0) {
          try {
            await User.findByIdAndUpdate(userId, {
              isOnline: false,
              lastSeen: Date.now(),
            });
            socket.broadcast.emit('userOffline', { userId });
            logger.info(`❌ User ${userId} disconnected (fully offline)`);
          } catch (e) {
            logger.error('❌ Error updating offline status:', e);
          }
        } else {
          logger.info(`👤 User ${userId} still has active connections`);
        }

        // Log current online users after disconnect
        logger.info('🔑 Current online users after disconnect:', getOnlineUsers());
      });

      // Reconnection handling
      socket.on('reconnect', async () => {
        try {
          await User.findByIdAndUpdate(userId, { isOnline: true });
          socket.broadcast.emit('userOnline', { userId });
          logger.info(`✅ User ${userId} reconnected`);
        } catch (e) {
          logger.error('❌ Error updating user online status on reconnect:', e);
        }
      });
    });
  });
};

module.exports = { handleSocketConnection };
