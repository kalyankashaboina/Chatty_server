const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Send message
router.post('/send', chatController.sendMessage);

// Get chat history (for a specific chat room or user)
router.get('/history', chatController.getChatHistory);

module.exports = router;
