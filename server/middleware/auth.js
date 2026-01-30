const jwt = require('jsonwebtoken');
const { userUtils } = require('../utils/dataManager');

// JWT Secret (should be in environment variables in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization header format. Expected: Bearer <token>'
      });
    }

    const token = parts[1];

    if (!token || token.trim() === '') {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    jwt.verify(token, JWT_SECRET, async (err, user) => {
      if (err) {
        console.log('JWT verification error:', err.name, err.message);
        if (err.name === 'JsonWebTokenError') {
          return res.status(401).json({
            success: false,
            message: 'Invalid token'
          });
        }
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'Token expired'
          });
        }
        if (err.name === 'NotBeforeError') {
          return res.status(401).json({
            success: false,
            message: 'Token not active'
          });
        }
        return res.status(403).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

      console.log('Decoded Token Payload:', user);
      if (!user || !user.id) {
        console.error('Token missing ID. Payload:', user);
        return res.status(403).json({ success: false, message: 'Invalid token payload' });
      }

      // Verify user still exists in database
      const existingUser = await userUtils.findUserById(user.id);
      if (!existingUser) {
        return res.status(403).json({
          success: false,
          message: 'User account not found'
        });
      }

      if (!existingUser.isActive) {
        return res.status(403).json({
          success: false,
          message: 'User account is deactivated'
        });
      }

      req.user = user;
      next();
    });
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }

  next();
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id || user.id, // Prioritize MongoDB _id
      email: user.email,
      role: user.role || 'customer',
      isAdmin: user.isAdmin || false
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Verify token (for testing)
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Role-based access control
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Simple rate limiting for auth endpoints
const rateLimiter = new Map();

const rateLimit = (maxRequests = 5, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const key = req.ip + req.path;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    for (const [ip, requests] of rateLimiter.entries()) {
      const validRequests = requests.filter(time => time > windowStart);
      if (validRequests.length === 0) {
        rateLimiter.delete(ip);
      } else {
        rateLimiter.set(ip, validRequests);
      }
    }

    // Check current IP
    const requests = rateLimiter.get(key) || [];
    const recentRequests = requests.filter(time => time > windowStart);

    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.'
      });
    }

    // Add current request
    recentRequests.push(now);
    rateLimiter.set(key, recentRequests);

    next();
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  generateToken,
  verifyToken,
  requireRole,
  rateLimit,
  JWT_SECRET
};
