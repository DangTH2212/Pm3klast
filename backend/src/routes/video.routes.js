const express = require('express');
const router = express.Router();

const { auth } = require('../middleware/auth.middleware');
const { getUserVideos, deleteVideoRecord } = require('../services/upload.service');

/**
 * @route   GET /api/videos
 * @desc    Get user's uploaded videos
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    const result = await getUserVideos(req.user._id, {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100),
      status
    });
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get videos'
    });
  }
});

/**
 * @route   GET /api/videos/:id
 * @desc    Get single video by ID
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const Video = require('../models/video.model');
    
    const video = await Video.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }
    
    res.json({
      success: true,
      data: { video }
    });
    
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get video'
    });
  }
});

/**
 * @route   GET /api/videos/stats/summary
 * @desc    Get video upload statistics
 * @access  Private
 */
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const Video = require('../models/video.model');
    
    const stats = await Video.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalSize: { $sum: '$localFile.size' }
        }
      }
    ]);
    
    const totalVideos = await Video.countDocuments({ userId: req.user._id });
    
    const summary = {
      total: totalVideos,
      byStatus: {},
      totalSize: 0
    };
    
    stats.forEach(stat => {
      summary.byStatus[stat._id] = stat.count;
      summary.totalSize += stat.totalSize || 0;
    });
    
    res.json({
      success: true,
      data: { stats: summary }
    });
    
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics'
    });
  }
});

/**
 * @route   DELETE /api/videos/:id
 * @desc    Delete video record
 * @access  Private
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await deleteVideoRecord(req.params.id, req.user._id);
    
    res.json({
      success: true,
      message: 'Video deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete video error:', error);
    
    if (error.message === 'Video not found') {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete video'
    });
  }
});

module.exports = router;
