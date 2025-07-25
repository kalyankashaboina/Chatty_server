const { getTokenFromCookies } = require('./auth');
const { addUser, removeUser, getOnlineUsers, getSocketIdByUserId } = require('./onlineUsers');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { addMessageToQueue } = require('./messageQueue');
const Message = require('../models/Message');
const logger = require('./logger');

const handleSocketConnection = io => {
  io.on('connection', socket => {
    logger.info('🔌 Incoming socket connection attempt...');

    const authToken = socket.handshake.auth?.token;
    const cookieToken = getTokenFromCookies(socket.request);
    const token = authToken || cookieToken;

    logger.info(`🔑 Token received from client: ${token ? 'Yes' : 'No'}`);

    if (!token) {
      logger.warn('❌ No token provided. Disconnecting socket...');
      return socket.disconnect(true);
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err || !decoded?.userId) {
        logger.error(`❌ Invalid or expired token: ${err?.message}`);
        return socket.disconnect(true);
      }

      const userId = decoded.userId;
      socket.userId = userId;

      logger.info(`✅ Token verified. User ID: ${userId} | Socket ID: ${socket.id}`);

      addUser(userId, socket.id);

      try {
        await User.findByIdAndUpdate(userId, { isOnline: true });
        logger.info(`🟢 User marked online in DB: ${userId}`);
      } catch (err) {
        logger.error(`❌ Failed to update online status in DB for ${userId}: ${err.message}`);
      }

      logger.info('👥 Online users snapshot:', getOnlineUsers());

      socket.broadcast.emit('userOnline', { userId });

      // Video call signaling events
      socket.on('offer', (offer, recipientId) => {
        logger.info(`📞 Offer: ${userId} -> ${recipientId}`);
        getSocketIdByUserId(recipientId).forEach(sid => io.to(sid).emit('offer', offer, userId));
      });

      socket.on('answer', (answer, recipientId) => {
        logger.info(`📞 Answer: ${userId} -> ${recipientId}`);
        getSocketIdByUserId(recipientId).forEach(sid => io.to(sid).emit('answer', answer, userId));
      });

      socket.on('ice-candidate', (candidate, recipientId) => {
        logger.info(`📞 ICE Candidate: ${userId} -> ${recipientId}`);
        getSocketIdByUserId(recipientId).forEach(sid =>
          io.to(sid).emit('ice-candidate', candidate, userId)
        );
      });

      socket.on('typing', ({ recipientId }) => {
        logger.info(`⌨️ Typing: ${userId} -> ${recipientId}`);
        getSocketIdByUserId(recipientId).forEach(sid =>
          io.to(sid).emit('typing', { senderId: userId })
        );
      });

      socket.on('stoppedTyping', ({ recipientId }) => {
        logger.info(`🛑 Stopped typing: ${userId} -> ${recipientId}`);
        getSocketIdByUserId(recipientId).forEach(sid =>
          io.to(sid).emit('stoppedTyping', { senderId: userId })
        );
      });

      socket.on('sendMessage', data => {
        const { recipientId, content, type = null, mediaUrl = null } = data;

        logger.info(`✉️ Message sent: ${userId} -> ${recipientId} | type: ${type}`);
        if (mediaUrl) logger.info(`📎 Media URL: ${mediaUrl}`);

        addMessageToQueue({
          sender: userId,
          recipient: recipientId,
          content,
          type,
          mediaUrl,
          timestamp: new Date(),
        });

        const recipientSockets = getSocketIdByUserId(recipientId);
        if (recipientSockets.length > 0) {
          recipientSockets.forEach(sid =>
            io.to(sid).emit('message', { senderId: userId, type, content, mediaUrl })
          );
          logger.info('✅ Message delivered to online user');
        } else {
          logger.info('📥 Message queued: recipient offline');
        }
      });

      socket.on('getRecentMessages', async otherUserId => {
        logger.info(`📤 Fetching recent messages for ${userId} <-> ${otherUserId}`);
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
          logger.error(`❌ Failed to fetch messages: ${err.message}`);
        }
      });

      socket.on('disconnect', async reason => {
        logger.warn(`❌ Socket disconnected: ${reason} | User ID: ${userId}`);

        removeUser(userId, socket.id);

        const remainingSockets = getSocketIdByUserId(userId);
        if (remainingSockets.length === 0) {
          try {
            await User.findByIdAndUpdate(userId, {
              isOnline: false,
              lastSeen: new Date(),
            });
            socket.broadcast.emit('userOffline', { userId });
            logger.info(`🟥 User ${userId} is now offline`);
          } catch (err) {
            logger.error(`❌ Error marking user offline: ${err.message}`);
          }
        } else {
          logger.info(`👤 User ${userId} still has other connections`);
        }

        logger.info('🧍 Final online users snapshot:', getOnlineUsers());
      });

      socket.on('reconnect', async () => {
        logger.info(`🔁 Reconnect triggered by ${userId}`);
        try {
          await User.findByIdAndUpdate(userId, { isOnline: true });
          socket.broadcast.emit('userOnline', { userId });
        } catch (err) {
          logger.error(`❌ Error on reconnect update: ${err.message}`);
        }
      });

      // Catch-all for unhandled events
      socket.onAny((event, ...args) => {
        logger.info(`📨 Received socket event: ${event}`, args);
      });
    });
  });
};

module.exports = { handleSocketConnection };
