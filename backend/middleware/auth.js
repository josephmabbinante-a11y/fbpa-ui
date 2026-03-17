
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// Utility: Get JWT secret from environment
function getJwtSecret() {
  const secret = process.env.JWT_SECRET ? process.env.JWT_SECRET.trim() : '';
  if (!secret) {
    console.error('[AUTH] JWT_SECRET is not configured');
    return null;
  }
  return secret;
}

// Utility: Verify JWT and return decoded payload or null
function verifyJwtToken(token) {
  const secret = getJwtSecret();
  if (!secret) return null;
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    return null;
  }
}

export function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  const decoded = verifyJwtToken(token);
  if (!decoded) {
    // If secret is missing, verifyJwtToken returns null and error is already logged
    const secret = getJwtSecret();
    if (!secret) {
      return res.status(500).json({ success: false, message: 'Server configuration error.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
  req.user = decoded;
  next();
}

export function requireDatabase(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database unavailable. Please try again later.' });
  }
  next();
}
