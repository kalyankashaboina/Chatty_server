import { Router } from 'express';
import { register, login, sidebarUsers, logout, googleLogin } from '../controllers/authController';
import authenticate from '../middleware/middleware';

const router = Router();

// Register user
router.post('/register', register);

// Login user
router.post('/login', login);

// Logout user
router.post('/logout', logout);
router.post('/google-login', googleLogin);

// Get sidebar users (authenticated)
router.get('/sidebar', authenticate, sidebarUsers);

export default router;
