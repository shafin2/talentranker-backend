import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';

// Generate access token (15 minutes)
export const generateAccessToken = (userId) => {
  return jwt.sign(
    { id: userId, type: 'access' }, 
    JWT_SECRET, 
    { expiresIn: '15m' }
  );
};

// Generate refresh token (7 days)
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId, type: 'refresh' }, 
    JWT_REFRESH_SECRET, 
    { expiresIn: '7d' }
  );
};

// Generate secure random token
export const generateSecureToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

// Verify access token
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid access token');
  }
};

// Verify refresh token
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};
