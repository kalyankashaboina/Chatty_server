// src/utils/messageQueue.ts

import Message, { IMessage } from '../models/Message';
import logger from './logger'; // Assuming you have a logger

// Define the shape of the message data
interface QueuedMessage {
  sender: string;
  recipient: string;
  content?: string;
  type?: 'text' | 'audio' | 'video' | 'image' | 'file' | null;
  mediaUrl?: string | null;
  timestamp: Date;
}

/**
 * Creates and saves a message directly to the database.
 * This is now an async function that returns the created message.
 * @param messageData The data for the message.
 * @returns The saved Mongoose document, or null if an error occurred.
 */
export const addMessageToQueue = async (messageData: QueuedMessage): Promise<IMessage | null> => {
  try {
    // 1. Create a new message instance from the data
    const newMessage = new Message(messageData);

    // 2. Save it to the database immediately and wait for the operation to complete
    await newMessage.save();

    // 3. Return the complete, saved message document (which now has an `_id`)
    return newMessage;
  } catch (err: any) {
    logger.error('❌ Error saving message directly to DB:', err.message);
    return null; // Return null to indicate failure
  }
};
