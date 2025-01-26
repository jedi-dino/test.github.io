import jwt from 'jsonwebtoken';
import User from './User.js';

// Generate JWT token
export const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Authentication middleware
export const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        throw new Error();
      }

      // Update last active timestamp
      user.lastActive = new Date();
      await user.save();

      req.user = user;
      req.token = token;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Optional auth middleware - doesn't require authentication but will process token if present
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (user) {
        // Update last active timestamp
        user.lastActive = new Date();
        await user.save();

        req.user = user;
        req.token = token;
      }
    } catch (error) {
      // Ignore token validation errors in optional auth
      console.log('Optional auth token error:', error.message);
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

// Rate limiting middleware
export const rateLimit = (limit = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up old requests
    requests.forEach((timestamps, key) => {
      requests.set(key, timestamps.filter(time => time > windowStart));
    });

    // Get user's requests in the current window
    const userRequests = requests.get(ip) || [];
    userRequests.push(now);
    requests.set(ip, userRequests);

    // Check if user has exceeded limit
    if (userRequests.length > limit) {
      return res.status(429).json({
        message: 'Too many requests, please try again later'
      });
    }

    next();
  };
};
