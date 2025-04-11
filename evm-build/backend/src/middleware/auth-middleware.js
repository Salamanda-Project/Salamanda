const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { ValidationError } = require('../../src/utils//errors');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Check for token in Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw ValidationError.message('No token provided');
    }

    // Extract token (expecting "Bearer <token>")
    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new ValidationError('Invalid token format');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by ID from token
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      throw new ValidationError('User not found');
    }

    // Attach user to request
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token',
          type: 'UnauthorizedError'
        }
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Token expired',
          type: 'UnauthorizedError'
        }
      });
    }

    // For other errors
    return res.status(401).json({
      success: false,
      error: {
        message: error.message,
        type: error.name
      }
    });
  }
};

/**
 * Role-based Authorization Middleware
 * @param {string[]} roles - Allowed roles
 */
const roleMiddleware = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          type: 'UnauthorizedError'
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Insufficient permissions',
          type: 'ForbiddenError'
        }
      });
    }

    next();
  };
};

module.exports = {
  authMiddleware,
  roleMiddleware
};