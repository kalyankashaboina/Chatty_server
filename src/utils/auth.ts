import jwt from 'jsonwebtoken';
import { Response, Request } from 'express';
import cookie from 'cookie';
import logger from './logger';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

// Generate JWT token
export const generateToken = (userId: string): string => {
  try {
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1d' });
    logger.info('✅ Token generated:', token);
    return token;
  } catch (error: any) {
    logger.error('❌ Error generating token:', error);
    throw new Error('Error generating token');
  }
};

// Verify JWT token
export const verifyToken = (token: string): any => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    logger.info('✅ Token verified successfully:', decoded);
    return decoded;
  } catch (error: any) {
    logger.error('❌ Invalid or expired token:', error.message);
    throw new Error('Invalid or expired token');
  }
};

// Set token as a cookie in response
export const setTokenCookie = (res: Response, token: string): void => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });
  logger.info('✅ Token set in cookie:', token);
};

// Retrieve token from cookies in the request
export const getTokenFromCookies = (req: Request): string | null => {
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

// Retrieve token from Authorization header
export const getTokenFromAuthHeader = (req: Request): string | null => {
  const token = req.headers.authorization?.split(' ')[1] ?? null;
  if (token) {
    logger.info('🔑 Token from Authorization header:', token);
  } else {
    logger.warn('⚠️ Authorization header missing or malformed');
  }
  return token;
};
