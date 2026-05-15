const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/user.model');
const { auth } = require('../middleware/auth.middleware');
const { oauthLimiter } = require('../middleware/rateLimiter.middleware');
const { 
  getOAuthUrl, 
  exchangeCodeForToken, 
  getUserProfile,
  refreshTikTokToken 
} = require('../services/tiktok.service');

/**
 * @route   GET /api/auth/oauth/url
 * @desc    Get TikTok OAuth URL
 * @access  Public
 */
router.get('/oauth/url', (req, res) => {
  try {
    const state = jwt.sign(
      { timestamp: Date.now() },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );
    
    const oauthUrl = getOAuthUrl(state);
    
    res.json({
      success: true,
      data: {
        url: oauthUrl,
        state
      }
    });
  } catch (error) {
    console.error('OAuth URL generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate OAuth URL'
    });
  }
});

/**
 * @route   POST /api/auth/tiktok/callback
 * @desc    Handle TikTok OAuth callback
 * @access  Public (but limited by rate limiter)
 */
router.post('/tiktok/callback', oauthLimiter, async (req, res) => {
  try {
    const { code, state } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required'
      });
    }
    
    // Validate state if provided (optional for sandbox)
    if (state) {
      try {
        jwt.verify(state, process.env.JWT_SECRET);
      } catch (err) {
        // State validation is optional in sandbox mode
        if (process.env.TIKTOK_ENV !== 'sandbox') {
          return res.status(400).json({
            success: false,
            message: 'Invalid state parameter'
          });
        }
      }
    }
    
    // Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(code);
    
    if (!tokenResponse.success) {
      return res.status(400).json({
        success: false,
        message: tokenResponse.error?.error_description || 'Failed to exchange code for token',
        code: tokenResponse.error?.error || 'TOKEN_EXCHANGE_FAILED'
      });
    }
    
    const tokenData = tokenResponse.data;
    
    // Get user profile from TikTok
    const profileResponse = await getUserProfile(tokenData.access_token);
    
    if (!profileResponse.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to get user profile from TikTok',
        code: 'PROFILE_FETCH_FAILED'
      });
    }
    
    const tiktokProfile = profileResponse.data.data;
    
    // Calculate token expiry
    const expiresAt = new Date(Date.now() + (tokenData.expires_in || 7200) * 1000);
    const refreshExpiresAt = new Date(Date.now() + (tokenData.refresh_expires_in || 86400) * 1000);
    
    // Find or create user by TikTok open_id
    let user = await User.findOne({ 'tiktok.open_id': tiktokProfile.open_id });
    
    if (user) {
      // Update existing user with new tokens and profile
      user.tiktok = {
        open_id: tiktokProfile.open_id,
        union_id: tiktokProfile.union_id,
        display_name: tiktokProfile.display_name || user.tiktok.display_name,
        avatar_url: tiktokProfile.avatar_url || user.tiktok.avatar_url,
        bio: tiktokProfile.bio || user.tiktok.bio,
        follower_count: tiktokProfile.follower_count,
        following_count: tiktokProfile.following_count,
        video_count: tiktokProfile.video_count,
        likes_count: tiktokProfile.likes_count
      };
      user.tokens = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_type: tokenData.token_type || 'Bearer',
        expires_at: expiresAt,
        refresh_expires_at: refreshExpiresAt
      };
      user.lastLogin = new Date();
      user.lastTokenRefresh = new Date();
      user.isVerified = true;
    } else {
      // Create new user
      user = new User({
        email: `${tiktokProfile.open_id}@tiktok.sandbox`,
        password: jwt.sign(tiktokProfile.open_id, process.env.JWT_SECRET),
        username: tiktokProfile.display_name || `user_${tiktokProfile.open_id.slice(0, 8)}`,
        tiktok: {
          open_id: tiktokProfile.open_id,
          union_id: tiktokProfile.union_id,
          display_name: tiktokProfile.display_name,
          avatar_url: tiktokProfile.avatar_url,
          bio: tiktokProfile.bio,
          follower_count: tiktokProfile.follower_count,
          following_count: tiktokProfile.following_count,
          video_count: tiktokProfile.video_count,
          likes_count: tiktokProfile.likes_count
        },
        tokens: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_type: tokenData.token_type || 'Bearer',
          expires_at: expiresAt,
          refresh_expires_at: refreshExpiresAt
        },
        lastLogin: new Date(),
        lastTokenRefresh: new Date(),
        isVerified: true
      });
    }
    
    await user.save();
    
    // Generate JWT for session
    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      message: 'TikTok account connected successfully',
      data: {
        token: jwtToken,
        user: user.toSafeObject()
      }
    });
    
  } catch (error) {
    console.error('TikTok OAuth callback error:', error);
    res.status(500).json({
      success: false,
      message: 'OAuth callback processing failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.toSafeObject()
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user data'
    });
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh TikTok token
 * @access  Private
 */
router.post('/refresh', auth, async (req, res) => {
  try {
    if (!req.user.tokens.refresh_token) {
      return res.status(400).json({
        success: false,
        message: 'No refresh token available. Please reconnect your TikTok account.'
      });
    }
    
    const refreshResponse = await refreshTikTokToken(req.user);
    
    if (!refreshResponse.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to refresh TikTok token',
        code: 'REFRESH_FAILED'
      });
    }
    
    const tokenData = refreshResponse.data;
    
    // Update user's tokens
    req.user.tokens.access_token = tokenData.access_token;
    if (tokenData.refresh_token) {
      req.user.tokens.refresh_token = tokenData.refresh_token;
    }
    req.user.tokens.expires_at = new Date(Date.now() + (tokenData.expires_in || 7200) * 1000);
    if (tokenData.refresh_expires_in) {
      req.user.tokens.refresh_expires_at = new Date(Date.now() + tokenData.refresh_expires_in * 1000);
    }
    req.user.lastTokenRefresh = new Date();
    
    await req.user.save();
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        expires_at: req.user.tokens.expires_at
      }
    });
    
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed'
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (clear local session)
 * @access  Private
 */
router.post('/logout', auth, async (req, res) => {
  try {
    // Optionally revoke TikTok token
    if (req.body.revoke_tiktok && req.user.tokens.access_token) {
      const { revokeToken } = require('../services/tiktok.service');
      await revokeToken(req.user.tokens.access_token);
    }
    
    // Clear tokens from user document (optional - keeps user logged in on other sessions)
    if (req.body.clear_all_tokens) {
      req.user.tokens = {};
      await req.user.save();
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

module.exports = router;
