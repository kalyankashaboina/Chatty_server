import { Router } from 'express';
import { sendMessage, getMessages, getLast20Messages } from '../controllers/messageController';
import authenticate from '../middleware/middleware';

const router = Router();

// Route to send a message
router.post('/send', authenticate, sendMessage);

// Route to get all messages
router.get('/', authenticate, getMessages);

// Route to get last 20 messages
router.get('/last20', authenticate, getLast20Messages);

export default router;
