const { verifyToken, getTokenFromCookies, getTokenFromAuthHeader } = require('../utils/auth');

const authenticate = (req, res, next) => {
  let token = getTokenFromCookies(req);
  if (!token) token = getTokenFromAuthHeader(req);

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.userId };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = authenticate;
