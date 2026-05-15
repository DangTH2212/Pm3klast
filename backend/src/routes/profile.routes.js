const express = require('express');
const router = express.Router();

const { auth, requireTikTok } = require('../middleware/auth.middleware');
const { getUserProfile } = require('../services/tiktok.service');

/**
 * @route   GET /api/profile
 * @desc    Get user's profile
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.toSafeObject(),
        tiktokConnected: !!req.user.tokens.access_token,
        tokenValid: req.user.tokens.access_token && !req.user.isTokenExpired()
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
});

/**
 * @route   GET /api/profile/tiktok
 * @desc    Get TikTok profile from API
 * @access  Private (requires TikTok connection)
 */
router.get('/tiktok', auth, requireTikTok, async (req, res) => {
  try {
    const response = await getUserProfile(req.user.tokens.access_token);
    
    if (!response.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to get TikTok profile',
        error: response.error
      });
    }
    
    // Update local cache
    const profile = response.data.data;
    
    req.user.tiktok = {
      ...req.user.tiktok,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      bio: profile.bio,
      follower_count: profile.follower_count,
      following_count: profile.following_count,
      video_count: profile.video_count,
      likes_count: profile.likes_count
    };
    await req.user.save();
    
    res.json({
      success: true,
      data: {
        profile,
        cached: false
      }
    });
    
  } catch (error) {
    console.error('Get TikTok profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get TikTok profile'
    });
  }
});

/**
 * @route   GET /api/profile/tiktok/cached
 * @desc    Get cached TikTok profile from database
 * @access  Private
 */
router.get('/tiktok/cached', auth, async (req, res) => {
  try {
    if (!req.user.tiktok.open_id) {
      return res.status(404).json({
        success: false,
        message: 'No TikTok account connected'
      });
    }
    
    res.json({
      success: true,
      data: {
        profile: {
          open_id: req.user.tiktok.open_id,
          union_id: req.user.tiktok.union_id,
          display_name: req.user.tiktok.display_name,
          avatar_url: req.user.tiktok.avatar_url,
          bio: req.user.tiktok.bio,
          follower_count: req.user.tiktok.follower_count,
          following_count: req.user.tiktok.following_count,
          video_count: req.user.tiktok.video_count,
          likes_count: req.user.tiktok.likes_count
        },
        tokenStatus: {
          hasToken: !!req.user.tokens.access_token,
          isExpired: req.user.isTokenExpired(),
          expiresAt: req.user.tokens.expires_at,
          lastRefresh: req.user.lastTokenRefresh
        }
      }
    });
    
  } catch (error) {
    console.error('Get cached profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cached profile'
    });
  }
});

module.exports = router;
