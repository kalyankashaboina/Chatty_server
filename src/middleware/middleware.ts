// src/middleware/middleware.ts
import { Request as ExpressRequest, Response, NextFunction } from 'express';
// We no longer need getTokenFromAuthHeader, so it can be removed from the import.
import { verifyToken, getTokenFromCookies } from '../utils/auth';
import logger from '../utils/logger';

// ✅ Local interface extending Express Request
interface RequestWithUser extends ExpressRequest {
  user?: { id: string };
}

const authenticate = (req: RequestWithUser, res: Response, next: NextFunction): void => {
  // Updated log to be specific about the authentication method.
  logger.info(`🔐 Authenticating [${req.method}] ${req.originalUrl} via httpOnly cookie...`);

  // Step 1: Get the token ONLY from the cookies.
  const token = getTokenFromCookies(req);

  // Step 2: If no token is found in the cookies, immediately fail.
  if (!token) {
    // Updated error log to be specific.
    logger.error('❌ AUTH FAILED: No token was provided in the request cookie.');
    res.status(401).json({ message: 'Authentication required. No token found in cookie.' });
    return; // Stop the request.
  }

  // Step 3: If a token was found, proceed with verification.
  try {
    const decoded = verifyToken(token);

    // Attach the user object to the request.
    req.user = { id: decoded.userId };

    logger.info(`✅ req.user successfully attached to the request:`, req.user);

    // Pass the request to the next handler in the chain.
    next();
  } catch (err: any) {
    logger.error(`❌ AUTH FAILED: Token verification failed. Reason: ${err.message}`);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export default authenticate;
