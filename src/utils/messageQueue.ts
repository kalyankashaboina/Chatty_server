// src/utils/messageQueue.ts
import Message, { IMessage } from '../models/Message';

interface QueuedMessage {
  sender: string;
  recipient: string;
  chat?: string;
  content?: string;
  type?: 'text' | 'audio' | 'video' | 'image' | 'file' | null;
  mediaUrl?: string | null;
  timestamp: Date;
}

// In-memory message buffer
let messageBuffer: QueuedMessage[] = [];

/**
 * Add a message to the in-memory queue.
 */
export const addMessageToQueue = (message: QueuedMessage): void => {
  messageBuffer.push(message);
};

/**
 * Flush the message buffer to MongoDB.
 * Uses insertMany for batch writes.
 */
export const flushMessages = async (): Promise<void> => {
  if (messageBuffer.length === 0) return;

  const messagesToSave = [...messageBuffer]; // snapshot
  messageBuffer = []; // clear buffer immediately to avoid blocking new messages

  try {
    await Message.insertMany(messagesToSave, { ordered: false });
    console.info(`🗂️ Flushed ${messagesToSave.length} messages to DB.`);
  } catch (err: any) {
    console.error('❌ Error saving messages batch:', err.message);
    // Optionally, requeue failed messages if needed
    // messageBuffer.push(...failedMessages);
  }
};

// Flush the buffer every 5 seconds
setInterval(flushMessages, 5000);
