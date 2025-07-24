// utils/messageQueue.js
const Message = require('../models/Message');

let messageBuffer = [];

const addMessageToQueue = message => {
  messageBuffer.push(message);
};

const flushMessages = async () => {
  if (messageBuffer.length === 0) return;

  try {
    await Message.insertMany(messageBuffer);
    console.log(`🗂️ Flushed ${messageBuffer.length} messages to DB.`);
    messageBuffer = [];
  } catch (err) {
    console.error('Error saving messages batch:', err);
  }
};

// Flush the message buffer every 5 seconds
setInterval(flushMessages, 5000);

module.exports = { addMessageToQueue };
