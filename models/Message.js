const mongoose = require('mongoose');

// Define the message schema
const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },

  type: {
    type: String,
    enum: ['text', 'audio', 'video', 'image', 'file'],
    default: 'text',
  },

  content: { type: String }, 
  mediaUrl: { type: String },

  read: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent',
  },

  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });


// Indexes for faster querying
messageSchema.index({ sender: 1, recipient: 1, timestamp: -1 }); // For 1:1 chats
messageSchema.index({ chat: 1, timestamp: -1 }); // For group chats

module.exports = mongoose.model('Message', messageSchema);
