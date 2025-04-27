const { verifyToken, getTokenFromCookies } = require('../utils/auth');

const authenticate = (req, res, next) => {
  const token = getTokenFromCookies(req); // Retrieve token from cookies
  console.log("🔑 Token from cookies in middleware:", token);
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = verifyToken(token);  // Verify the token
    req.user = decoded; 
    req.user = { id: decoded.userId };
    console.log("🔑 Token verified, user data:", decoded);
    next();  // Proceed to the next middleware or route
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = authenticate;
