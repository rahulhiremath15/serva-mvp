const jwt = require('jsonwebtoken');
const { userUtils } = require('./dataManager');

// JWT Secret (should be in environment variables in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token is required'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    req.user = user;
    next();
  });
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
      id: user.id,
      email: user.email,
      role: user.role 
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

// Rate limiting for auth endpoints
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
