// Middleware to verify JWT token and attach userId
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  // Get token from cookies instead of Authorization header
  const token = req.cookies.token; 

  // Log the token received for debugging
  console.log(`🌐 Token received: ${token ? token : 'No token provided'}`); 

  if (!token) {
    console.log('❌ Authentication failed: Token not provided');
    return res.status(401).json({ message: 'Authentication token is required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log(`❌ Authentication failed: Invalid or expired token. Error: ${err.message}`);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    // Log successful authentication with the user ID decoded from the token
    req.userId = decoded.userId;
    console.log(`✅ Authenticated successfully for user ID: ${req.userId}`);

    next();
  });
};

module.exports = authenticate;
