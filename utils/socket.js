// handleSocketConnection.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const logger = require('./logger');
const { addMessageToQueue } = require('./messageQueue');
const {
  addUser,
  removeUser,
  getSocketIdByUserId,
  setUserInCall,
  isUserInCall,
  getUserState,
  getOnlineUserIds,
  getUsernameById,
} = require('./onlineUsers');
const { getTokenFromCookies } = require('./auth');

const handleSocketConnection = io => {
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  io.on('connection', socket => {
    logger.info(`🔌 [Connect] Incoming socket connection attempt... | Socket ID: ${socket.id}`);

    const token = socket.handshake.auth?.token || getTokenFromCookies(socket.request);

    if (!token) {
      logger.warn(`❌ [Auth] No token provided. Disconnecting socket ${socket.id}.`);
      return socket.disconnect(true);
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err || !decoded?.userId) {
        logger.error(
          `❌ [Auth] Invalid or expired token for socket ${socket.id}. Error: ${err?.message}`
        );
        return socket.disconnect(true);
      }

      const userFromDb = await User.findById(decoded.userId).select('username').lean();
      if (!userFromDb) {
        logger.error(`❌ [Auth] Authenticated user ${decoded.userId} not found in database.`);
        return socket.disconnect(true);
      }

      const userId = userFromDb._id.toString();
      const username = userFromDb.username;
      socket.userId = userId;
      socket.username = username;

      addUser(userId, socket.id, username);
      logger.info(
        `✅ [Auth] User authenticated: ${username} (ID: ${userId}) | Socket: ${socket.id}`
      );

      socket.emit('webrtc-config', { iceServers });
      try {
        await User.findByIdAndUpdate(userId, { isOnline: true });
        socket.broadcast.emit('userOnline', { userId });
        logger.info(`🟢 [Status] User ${username} marked as online.`);
      } catch (dbErr) {
        logger.error(`❌ [DB] Failed to update online status for ${username}: ${dbErr.message}`);
      }

      // =================================================================
      //                 CHAT FUNCTIONALITY (WITH NAMES)
      // =================================================================

      socket.on('sendMessage', data => {
        const { recipientId, content, type = 'text', mediaUrl = null } = data;
        const senderUsername = socket.username;
        const recipientUsername = getUsernameById(recipientId);

        logger.info(
          `✉️ [Message] From: ${senderUsername} -> To: ${recipientUsername} | Type: ${type}`
        );

        addMessageToQueue({
          sender: socket.userId,
          recipient: recipientId,
          content,
          type,
          mediaUrl,
          timestamp: new Date(),
        });

        const recipientSockets = getSocketIdByUserId(recipientId);
        if (recipientSockets.length > 0) {
          recipientSockets.forEach(sid =>
            io.to(sid).emit('message', {
              senderId: socket.userId,
              type,
              content,
              mediaUrl,
            })
          );
          logger.info(`✅ [Message] Delivered live to ${recipientUsername}.`);
        } else {
          logger.info(`📥 [Message] Queued for offline user ${recipientUsername}.`);
        }
      });

      socket.on('typing', ({ recipientId }) => {
        const senderUsername = socket.username;
        const recipientUsername = getUsernameById(recipientId);
        logger.info(`⌨️ [Typing] ${senderUsername} is typing to ${recipientUsername}`);

        const recipientSockets = getSocketIdByUserId(recipientId);
        recipientSockets.forEach(sid => io.to(sid).emit('typing', { senderId: socket.userId }));
      });

      socket.on('stoppedTyping', ({ recipientId }) => {
        const senderUsername = socket.username;
        const recipientUsername = getUsernameById(recipientId);
        logger.info(`🛑 [Stopped Typing] ${senderUsername} stopped typing to ${recipientUsername}`);

        const recipientSockets = getSocketIdByUserId(recipientId);
        recipientSockets.forEach(sid =>
          io.to(sid).emit('stoppedTyping', { senderId: socket.userId })
        );
      });

      // =================================================================
      //                 VIDEO & AUDIO CALL SIGNALING (WITH NAMES)
      // =================================================================

      socket.on('callRequest', async data => {
        const { toUserId, callType, offer, callId } = data;
        const fromUsername = socket.username;
        const toUsername = getUsernameById(toUserId);

        logger.info(
          `📞 [Call Request] From: ${fromUsername} ➡️ To: ${toUsername} | Type: ${callType} | CallID: ${callId}`
        );

        if (isUserInCall(toUserId)) {
          logger.warn(
            `⚠️ [Call Busy] ${toUsername} is already in a call. Notifying ${fromUsername}.`
          );
          socket.emit('callFailed', { toUserId, reason: 'User is busy in another call.' });
          return;
        }

        const toSockets = getSocketIdByUserId(toUserId);
        if (toSockets.length > 0) {
          toSockets.forEach(sid => {
            io.to(sid).emit('incomingCall', {
              fromUserId: socket.userId,
              fromUsername,
              callType,
              offer,
              callId,
            });
          });
          logger.info(`✅ [Call Ringing] Sent 'incomingCall' to ${toUsername}'s sockets.`);
        } else {
          logger.warn(`❌ [Call Offline] ${toUsername} is offline. Notifying ${fromUsername}.`);
          socket.emit('callFailed', { toUserId, reason: 'User is offline.' });
        }
      });

      socket.on('callAccepted', data => {
        /* ... Unchanged ... */
      });
      socket.on('callRejected', data => {
        /* ... Unchanged ... */
      });
      socket.on('callEnded', data => {
        /* ... Unchanged ... */
      });
      socket.on('ice-candidate', data => {
        /* ... Unchanged ... */
      });

      // =================================================================
      //                 CONNECTION MANAGEMENT (WITH NAMES)
      // =================================================================

      socket.on('disconnect', async reason => {
        const username = socket.username || userId;
        logger.warn(
          `🔌 [Disconnect] User disconnected: ${username} (ID: ${userId}) | Socket: ${socket.id} | Reason: ${reason}`
        );
        // ... rest of disconnect logic is correct
      });
    });
  });
};

module.exports = { handleSocketConnection };
