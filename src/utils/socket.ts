import { Server, Socket } from 'socket.io';
import { Request } from 'express';
import { getTokenFromCookies } from './auth';
import { addUser, removeUser, getOnlineUsers, getSocketIdByUserId } from './onlineUsers';
import User from '../models/User';
import jwt from 'jsonwebtoken';
import { addMessageToQueue } from './messageQueue';
import Message from '../models/Message';
import logger from './logger';

type MessageType = 'text' | 'audio' | 'video' | 'image' | 'file' | null;

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

interface SendMessageData {
  recipientId: string;
  content?: string;
  type?: MessageType;
  mediaUrl?: string;
}

export const handleSocketConnection = (io: Server) => {
  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info('🔌 Incoming socket connection...');

    const authToken = socket.handshake.auth?.token;
    const cookieToken = getTokenFromCookies(socket.request as Request);
    const token = authToken || cookieToken;

    if (!token) {
      logger.warn('❌ No token provided. Disconnecting socket...');
      return socket.disconnect(true);
    }

    jwt.verify(token, process.env.JWT_SECRET!, async (err: any, decoded: any) => {
      if (err || !decoded?.userId) {
        logger.error(`❌ Invalid or expired token: ${err?.message}`);
        return socket.disconnect(true);
      }

      const userId: string = decoded.userId;
      socket.userId = userId;

      // Add socket to onlineUsers map
      addUser(userId, socket.id);

      // Mark user online in DB
      try {
        await User.findByIdAndUpdate(userId, { isOnline: true });
        socket.broadcast.emit('userOnline', { userId });
        logger.info(`🟢 User ${userId} is online`);
      } catch (err: any) {
        logger.error(`❌ Failed to mark user online: ${err.message}`);
      }

      // ===== Video call =====
      socket.on('offer', (offer: any, recipientId: string) => {
        getSocketIdByUserId(recipientId).forEach(sid => io.to(sid).emit('offer', offer, userId));
      });

      socket.on('answer', (answer: any, recipientId: string) => {
        getSocketIdByUserId(recipientId).forEach(sid => io.to(sid).emit('answer', answer, userId));
      });

      socket.on('ice-candidate', (candidate: any, recipientId: string) => {
        getSocketIdByUserId(recipientId).forEach(sid =>
          io.to(sid).emit('ice-candidate', candidate, userId)
        );
      });

      // ===== Typing =====
      socket.on('typing', ({ recipientId }: { recipientId: string }) => {
        getSocketIdByUserId(recipientId).forEach(sid =>
          io.to(sid).emit('typing', { senderId: userId })
        );
      });

      socket.on('stoppedTyping', ({ recipientId }: { recipientId: string }) => {
        getSocketIdByUserId(recipientId).forEach(sid =>
          io.to(sid).emit('stoppedTyping', { senderId: userId })
        );
      });

      // ===== Messaging =====
      socket.on('sendMessage', (data: SendMessageData) => {
        const { recipientId, content, type = 'text', mediaUrl } = data;
        if (!recipientId || (!content && !mediaUrl)) return;

        addMessageToQueue({
          sender: userId,
          recipient: recipientId,
          content: content || '',
          type,
          mediaUrl: mediaUrl || null,
          timestamp: new Date(),
        });

        getSocketIdByUserId(recipientId).forEach(sid =>
          io.to(sid).emit('message', { senderId: userId, type, content, mediaUrl })
        );
      });

      socket.on('getRecentMessages', async (otherUserId: string) => {
        if (!otherUserId) return;

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
        } catch (err: any) {
          logger.error(`❌ Failed to fetch messages: ${err.message}`);
        }
      });

      // ===== Disconnect =====
      socket.on('disconnect', async reason => {
        removeUser(userId, socket.id);
        const remainingSockets = getSocketIdByUserId(userId);

        if (remainingSockets.length === 0) {
          try {
            await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
            socket.broadcast.emit('userOffline', { userId });
            logger.info(`🟥 User ${userId} is now offline`);
          } catch (err: any) {
            logger.error(`❌ Error marking user offline: ${err.message}`);
          }
        }
      });

      // Debug: catch all
      socket.onAny((event, ...args) => {
        logger.info(`📨 Event: ${event}`, args);
      });
    });
  });
};
