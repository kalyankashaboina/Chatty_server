// src/models/Chat.ts

import mongoose, { Schema, Document, Types, model } from 'mongoose';

export interface IChat extends Document {
  participants: Types.ObjectId[];
  messages: Types.ObjectId[];
  isGroupChat: boolean;
  groupName: string;
}

const chatSchema = new Schema<IChat>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    messages: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Message',
      },
    ],
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    groupName: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export default model<IChat>('Chat', chatSchema);
