const express = require('express');
const { sendMessage, getMessages, getLast20Messages } = require('../controllers/messageController');

const router = express.Router();

// Route to send a message
router.post('/send', sendMessage);

// Route to get all messages
router.get('/', getMessages);
router.get('/last20', getLast20Messages);

module.exports = router;
