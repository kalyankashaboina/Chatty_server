// Middleware to verify JWT token and attach userId
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  // Get token from cookies instead of Authorization header
  const token = req.cookies.token; 

  if (!token) {
    return res.status(401).json({ message: 'Authentication token is required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.userId = decoded.userId; 
    console.log(`Authenticated user ID: ${req.userId}`); // Log the user ID for debugging
    next();
  });
};

module.exports = authenticate;
