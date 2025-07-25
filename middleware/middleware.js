const { verifyToken, getTokenFromCookies, getTokenFromAuthHeader } = require('../utils/auth');
const logger = require('../utils/logger');

const authenticate = (req, res, next) => {
  logger.info('🔐 Authenticating incoming request...');

  let token = getTokenFromCookies(req);
  if (!token) {
    logger.warn('⚠️ No token found in cookies. Trying Authorization header...');
    token = getTokenFromAuthHeader(req);
  }

  if (!token) {
    logger.warn('❌ No token provided in request');
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.userId };
    logger.info(`✅ Token verified for user: ${decoded.userId}`);
    next();
  } catch (err) {
    logger.error(`❌ Token verification failed: ${err.message}`);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = authenticate;
