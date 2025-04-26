// utils/auth.js

const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (userId) => {
  try {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1D' });
  } catch (error) {
    throw new Error('Error generating token');
  }
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Set token as a cookie in response
const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,  
    // secure:true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, 
    SameSite: 'None', 
  });
};

module.exports = {
  generateToken,
  verifyToken,
  setTokenCookie,
};
