const mongoose = require('mongoose');

// Define the chat schema (either one-to-one or group chat)
const chatSchema = new mongoose.Schema({
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model
      required: true,
    },
  ],
  messages: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message', // Reference to the Message model (messages for the chat)
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
  // You can add more fields here, such as 'groupAdmin', 'chatType', etc.
});

module.exports = mongoose.model('Chat', chatSchema);
