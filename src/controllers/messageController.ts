// src/controllers/messageController.ts
import { Request, Response } from 'express';
import Message from '../models/Message';
import { Types } from 'mongoose';
import logger from '../utils/logger';
import Chat from '../models/Chat';
import { AuthenticatedRequest } from '../types';

export const sendMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  // The frontend now only sends receiver and content
  const { receiver, content, type } = req.body;
  const senderId = req.user?.id;

  if (!senderId || !receiver || !content) {
    res.status(400).json({ message: 'Missing required fields: sender, receiver, and content' });
    return;
  }

  try {
    // --- "Find or Create Chat" Logic ---
    let chat = await Chat.findOne({
      isGroupChat: false,
      participants: { $all: [senderId, receiver] }, // Find a chat with exactly these two users
    });

    // If no chat exists, create a new one
    if (!chat) {
      logger.info(`No existing chat found between ${senderId} and ${receiver}. Creating new chat.`);
      chat = new Chat({
        participants: [senderId, receiver],
        messages: [], // Start with an empty message array
      });
      await chat.save();
    }

    // Create the new message and link it to the chat's ID
    const newMessage = new Message({
      sender: senderId,
      receiver: receiver,
      content: content,
      type: type || 'text',
      chat: chat._id, // Use the real ObjectId from the found or created chat
    });

    await newMessage.save();

    // Add the new message's ID to the chat's messages array for reference
    // chat.messages.push(newMessage._id);
    await chat.save();

    // Populate sender info for the response to be sent to the client
    await newMessage.populate('sender', 'username');

    res.status(201).json(newMessage);
  } catch (error: any) {
    logger.error('💥 Failed to send message:', error);
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
};

// ----------------------- GET ALL MESSAGES -----------------------
export const getMessages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized: User ID missing' });
    return;
  }

  try {
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error: any) {
    console.error('Failed to fetch messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
  }
};

// ----------------------- GET LAST N MESSAGES WITH PAGINATION -----------------------
export const getLast20Messages = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  logger.info(
    '✅ Request successfully passed authentication. Welcome to getLast20Messages!',
    req.user
  );
  const userId = req.user?.id;
  const { selectedUserId, page = '1', limit = '20' } = req.query;

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized: User ID missing' });
    return;
  }

  if (!selectedUserId || typeof selectedUserId !== 'string') {
    res.status(400).json({ message: 'selectedUserId is required' });
    return;
  }

  if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(selectedUserId)) {
    res.status(400).json({ message: 'Invalid userId or selectedUserId' });
    return;
  }

  const pageNumber = parseInt(page as string, 10);
  const pageSize = parseInt(limit as string, 10);

  if (isNaN(pageNumber) || pageNumber <= 0 || isNaN(pageSize) || pageSize <= 0) {
    res.status(400).json({ message: 'Invalid page or limit values' });
    return;
  }

  try {
    const totalMessages = await Message.countDocuments({
      $or: [
        { sender: userId, receiver: selectedUserId },
        { sender: selectedUserId, receiver: userId },
      ],
    });

    const skip = (pageNumber - 1) * pageSize;

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: selectedUserId },
        { sender: selectedUserId, receiver: userId },
      ],
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    res.json({ messages: messages.reverse(), total: totalMessages });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error while fetching messages', error: error.message });
  }
};
