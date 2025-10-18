// src/controllers/authController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import User, { IUser } from '../models/User';
import { generateToken, setTokenCookie } from '../utils/auth';
import logger from '../utils/logger';
import { OAuth2Client } from 'google-auth-library';
import { AuthenticatedRequest } from '../types';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ----------------------- REGISTER -----------------------
export const register = async (req: Request, res: Response): Promise<void> => {
  const { username, email, password } = req.body as {
    username: string;
    email: string;
    password: string;
  };

  if (!username || !email || !password) {
    res.status(400).json({ message: 'All fields are required' });
    logger.warn('❌ Missing registration fields', req.body);
    return;
  }

  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] }).lean();
    if (existingUser) {
      res.status(400).json({ message: 'User with this email or username already exists' });
      logger.info(`❌ Registration failed - user exists: ${email} / ${username}`);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser: IUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: newUser._id, username, email },
    });
    logger.info('✅ User registered successfully:', { id: newUser._id, username, email });
  } catch (err: any) {
    logger.error('💥 Registration error:', err);
    res.status(500).json({ message: 'Internal Server Error. Please try again later.' });
  }
};

// ----------------------- LOGIN -----------------------
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    logger.warn('❌ Login failed - missing email or password', req.body);
    return;
  }

  try {
    const user: IUser | null = await User.findOne({ email }).lean();
    if (!user) {
      res.status(400).json({ message: 'User not found' });
      logger.info(`❌ Login failed - user not found: ${email}`);
      return;
    }

    const isMatch = await bcrypt.compare(password, (user as any).password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      logger.info(`❌ Login failed - invalid credentials: ${email}`);
      return;
    }

    const token = generateToken(user._id.toString());
    setTokenCookie(res, token);

    res.status(200).json({
      message: 'Login successful',
      user: { id: user._id.toString(), username: user.username, email: user.email },
    });
    logger.info(`✅ User logged in: ${user.username} (${user._id})`);
  } catch (err: any) {
    logger.error('💥 Login error:', err);
    res.status(500).json({ message: 'Internal Server Error. Please try again later.' });
  }
};

// ----------------------- GOOGLE LOGIN -----------------------
export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  // I am using 'googleToken' here to match your frontend code
  const { googleToken } = req.body as { googleToken: string };
  if (!googleToken) {
    res.status(400).json({ message: 'Google Token is required' });
    return;
  }

  try {
    if (!process.env.GOOGLE_CLIENT_ID) throw new Error('GOOGLE_CLIENT_ID not set');

    // Step 1: Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.name) {
      res.status(400).json({ message: 'Invalid Google token payload' });
      return;
    }

    let user = await User.findOne({ email: payload.email });

    if (user) {
      logger.info(`✅ Existing user found via Google email: ${user.email}`);

      user.username = payload.name;
      await user.save();
    } else {
      user = new User({
        username: payload.name,
        email: payload.email,
        password: await bcrypt.hash(Math.random().toString(36), 10),
      });
      logger.info('🔐 Creating new user from Google login:', user.email);
      await user.save();
    }
    const token = generateToken(user._id.toString());
    setTokenCookie(res, token);

    res.status(200).json({
      message: 'Google login successful',
      user: { id: user._id.toString(), username: user.username, email: user.email },
    });
    logger.info(`✅ User logged in via Google: ${user.email}`);
  } catch (err: any) {
    logger.error('💥 Google login error:', err);
    res.status(500).json({ message: 'Google login failed', error: err.message });
  }
};

// ----------------------- LOGOUT -----------------------
export const logout = (req: Request, res: Response): void => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    res.status(200).json({ message: 'Logout successful' });
    logger.info('✅ User logged out');
  } catch (err: any) {
    logger.error('💥 Logout error:', err);
    res.status(500).json({ message: 'Internal Server Error. Please try again later.' });
  }
};

// ----------------------- SIDEBAR USERS -----------------------
export const sidebarUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  logger.info('👥 Fetching sidebar users...', req.user);
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    logger.warn('❌ Sidebar fetch failed - no user id');
    return;
  }

  try {
    const users = await User.find({ _id: { $ne: userId } })
      .select('_id username email')
      .lean();
    if (!users.length) {
      res.status(404).json({ message: 'No users found' });
      logger.info(`⚠️ No sidebar users for userId: ${userId}`);
      return;
    }

    res.status(200).json({ users });
    logger.info(`✅ Sidebar users fetched for userId: ${userId}`);
  } catch (err: any) {
    logger.error('💥 Sidebar fetch error:', err);
    res.status(500).json({ message: 'Internal Server Error. Please try again later.' });
  }
};
