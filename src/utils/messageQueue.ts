// src/utils/messageQueue.ts

import Message, { IMessage } from '../models/Message';
import logger from './logger';

interface QueuedMessage {
  sender: string;
  receiver: string;
  content?: string;
  type?: 'text' | 'audio' | 'video' | 'image' | 'file' | null;
  mediaUrl?: string | null;
  timestamp: Date;
}

export const addMessageToQueue = async (messageData: QueuedMessage): Promise<IMessage | null> => {
  try {
    const newMessage = new Message(messageData);
    await newMessage.save();
    return newMessage;
  } catch (err: any) {
    logger.error('❌ Error saving message directly to DB:', err);
    return null;
  }
};
