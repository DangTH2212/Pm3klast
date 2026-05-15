const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please login to get access token.'
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format'
      });
    }
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired. Please login again.',
          code: 'TOKEN_EXPIRED'
        });
      }
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      }
      throw jwtError;
    }
    
    // Find user by id from token
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token may be invalid.'
      });
    }
    
    // Check if user account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }
    
    // Check if TikTok token is still valid (if user has TikTok connected)
    if (user.tokens.access_token) {
      const isTokenExpired = user.isTokenExpired();
      
      if (isTokenExpired && user.tokens.refresh_token) {
        // Try to refresh the token automatically
        const { refreshTikTokToken } = require('../services/tiktok.service');
        
        try {
          const refreshed = await refreshTikTokToken(user);
          
          if (refreshed) {
            // Re-fetch user with new tokens
            const updatedUser = await User.findById(decoded.userId);
            req.user = updatedUser;
          } else {
            // Token refresh failed, but continue with request
            req.user = user;
            req.tokenWarning = 'TikTok token may need re-authorization';
          }
        } catch (refreshError) {
          console.error('Token refresh error in auth middleware:', refreshError);
          req.user = user;
          req.tokenWarning = 'TikTok token refresh failed';
        }
      } else {
        req.user = user;
      }
    } else {
      req.user = user;
    }
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Optional auth middleware
 * Attaches user if token exists, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return next();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (user && user.isActive) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Don't fail on token errors in optional auth
    next();
  }
};

/**
 * Require TikTok connection middleware
 * Ensures user has connected their TikTok account
 */
const requireTikTok = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (!req.user.tokens.access_token) {
      return res.status(403).json({
        success: false,
        message: 'TikTok account not connected. Please connect your TikTok account first.',
        code: 'TIKTOK_NOT_CONNECTED'
      });
    }
    
    if (!req.user.tiktok.open_id) {
      return res.status(403).json({
        success: false,
        message: 'TikTok open_id not found. Please reconnect your TikTok account.',
        code: 'TIKTOK_NOT_CONFIGURED'
      });
    }
    
    next();
  } catch (error) {
    console.error('requireTikTok middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking TikTok connection'
    });
  }
};

module.exports = {
  auth,
  optionalAuth,
  requireTikTok
};
