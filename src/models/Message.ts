// src/models/Message.ts

import mongoose, { Schema, Document, Types, model } from 'mongoose';

export interface IMessage extends Document {
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  chat: Types.ObjectId;
  type: 'text' | 'audio' | 'video' | 'image' | 'file';
  content?: string;
  mediaUrl?: string;
  read: boolean;
  status: 'sent' | 'delivered' | 'read';
  timestamp: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    chat: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['text', 'audio', 'video', 'image', 'file'],
      default: 'text',
    },
    content: { type: String },
    mediaUrl: { type: String },
    read: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
      index: true,
    },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  // The { timestamps: true } option automatically adds createdAt and updatedAt fields.
  { timestamps: true }
);

// Add indexes for common queries
messageSchema.index({ chat: 1, timestamp: -1 });
messageSchema.index({ receiver: 1, read: 1, timestamp: -1 });

export default model<IMessage>('Message', messageSchema);
