const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateToken, setTokenCookie } = require('../utils/auth');
const logger = require('../utils/logger');

// Register user
const register = async (req, res) => {
  const { username, email, password } = req.body;
  logger.info('💬 Register attempt with data:', {
    username,
    email,
    password,
  });

  try {
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();
    logger.info('✅ User registered:', newUser);

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    logger.error('Register error:', error);
    res.status(500).json({ message: 'Internal Server Error. Please try again later.' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    logger.info(`💬 Login attempt with email: ${email}`);
    if (!email || !password) {
      logger.info('❌ Missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // logger.info(`❌ User not found with email: ${email}`);
      logger.info(`❌ User not found with email: ${email}`);
      return res.status(400).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // logger.info(`❌ Invalid credentials for email: ${email}`);
      logger.info(`❌ Invalid credentials for email: ${email}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);
    logger.info('🔑 JWT token generated:', token);

    //  Set token in the response cookie
    setTokenCookie(res, token);
    logger.info('✅ Token set in cookie');

    res.status(200).json({
      message: 'Login successful',
      user: { id: user._id, username: user.username, email: user.email },
    });
    logger.info(`✅ User logged in: ${user.username} (${user._id})`);
  } catch (error) {
    logger.error('💥 Login error:', error);
    res.status(500).json({
      message: 'Internal Server Error. Please try again later.',
      error: error.message,
    });
  }
};

// Logout user
const logout = (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // Match 'None' in production
    });

    res.status(200).json({ message: 'Logout successful' });
    logger.info('✅ User logged out, token removed from cookie');
    process.env.NODE_ENV != 'production' &&
      logger.info('────────────────────────────────────────────');
  } catch (error) {
    logger.error('💥 Logout error:', error);
    res.status(500).json({ message: 'Internal Server Error. Please try again later.' });
  }
};

// Get list of users for sidebar
const sidebarUsers = async (req, res) => {
  const userId = req.user.id;
  // logger.info("💬 Fetching sidebar users for userId:", userId);

  try {
    const users = await User.find({ _id: { $ne: userId } }).select('_id  username');
    if (!users) {
      return res.status(404).json({ message: 'No users found' });
    }
    logger.info(`Sidebar users:\n${JSON.stringify(users, null, 2)}`);

    res.status(200).json({ users });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal Server Error. Please try again later.' });
  }
};

module.exports = {
  register,
  login,
  logout,
  sidebarUsers,
};
