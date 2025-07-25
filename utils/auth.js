const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const logger = require('./logger');

// Generate JWT token
const generateToken = userId => {
  try {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1D' });
    logger.info('✅ Token generated:', token);
    return token;
  } catch (error) {
    logger.error('❌ Error generating token:', error);
    throw new Error('Error generating token');
  }
};

// Verify JWT token
const verifyToken = token => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    logger.info('✅ Token verified successfully:', decoded);
    return decoded;
  } catch (error) {
    logger.error('❌ Invalid or expired token:', error.message);
    throw new Error('Invalid or expired token');
  }
};

// Set token as a cookie in response
const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    maxAge: 24 * 60 * 60 * 1000,
  });
  logger.info('✅ Token set in cookie:', token);
};

// Retrieve token from cookies in the request
const getTokenFromCookies = req => {
  logger.info('🔑 Incoming cookie header:', req.headers.cookie);

  const cookies = req.headers.cookie;
  if (!cookies) {
    logger.warn('⚠️ No cookies found in request');
    return null;
  }

  const parsedCookies = cookie.parse(cookies);
  logger.info('🔑 Parsed cookies:', parsedCookies);

  if (!parsedCookies.token) {
    logger.warn('⚠️ Token cookie not found');
  }
  return parsedCookies.token || null;
};

// 🔐 Retrieve token from Authorization header
const getTokenFromAuthHeader = req => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    logger.info('🔑 Token from Authorization header:', token);
    return token;
  }
  logger.warn('⚠️ Authorization header missing or malformed');
  return null;
};

module.exports = {
  generateToken,
  verifyToken,
  setTokenCookie,
  getTokenFromCookies,
  getTokenFromAuthHeader,
};
