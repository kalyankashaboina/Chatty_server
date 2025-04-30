const jwt = require('jsonwebtoken');
const cookie = require('cookie');


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
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    maxAge: 24 * 60 * 60 * 1000,
  });
  console.log("✅ Token set in cookie:", token);  
};

// Retrieve token from cookies in the request
const getTokenFromCookies = (req) => {
console.log("🔑 Token from cookies in auth.js:", req.headers.cookie)

  const cookies = req.headers.cookie;
  if (!cookies) return null;
  
  const parsedCookies = cookie.parse(cookies);
  console.log("🔑 Parsed cookies:", parsedCookies)
  return parsedCookies.token || null;
};


// 🔐 Retrieve token from Authorization header
const getTokenFromAuthHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    console.log("🔑 Token from Authorization header:", token);
    return token;
  }
  return null;
};
module.exports = {
  generateToken,
  verifyToken,
  setTokenCookie,
  getTokenFromCookies,
  getTokenFromAuthHeader,
};
