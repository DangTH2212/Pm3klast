const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const { auth, requireTikTok } = require('../middleware/auth.middleware');
const { uploadLimiter } = require('../middleware/rateLimiter.middleware');
const { uploadVideoToTikTok } = require('../services/upload.service');

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../uploads/videos');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `video-${uniqueSuffix}${ext}`);
  }
});

// File filter for videos only
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed (mp4, mov, avi, webm)'), false);
  }
};

// Configure multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
    files: 1 // Only one file at a time
  }
});

/**
 * @route   POST /api/tiktok/upload
 * @desc    Upload video to TikTok
 * @access  Private (requires TikTok connection)
 */
router.post('/upload', auth, requireTikTok, uploadLimiter, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file provided'
      });
    }
    
    const { title, description, privacy_level, disable_comment, disable_share } = req.body;
    
    const videoData = {
      videoPath: req.file.path,
      title: title || 'Video from PM3K',
      description: description || '',
      postSettings: {
        privacy_level: privacy_level || 'PUBLIC',
        disable_comment: disable_comment === 'true' || disable_comment === true,
        disable_share: disable_share === 'true' || disable_share === true
      }
    };
    
    const result = await uploadVideoToTikTok(req.user, videoData);
    
    res.json({
      success: true,
      message: 'Video uploaded successfully',
      data: {
        video: result.video,
        publishId: result.publishId,
        shareUrl: result.shareUrl
      }
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Video upload failed'
    });
  }
});

/**
 * @route   POST /api/tiktok/upload/init
 * @desc    Initialize TikTok upload (get upload URL)
 * @access  Private (requires TikTok connection)
 */
router.post('/upload/init', auth, requireTikTok, async (req, res) => {
  try {
    const { initializeUpload, getUploadUrl } = require('../services/tiktok.service');
    
    // Initialize upload
    const initResponse = await initializeUpload(req.user.tokens.access_token, {
      upload_type: 'video',
      source: 'FILE_UPLOAD'
    });
    
    if (!initResponse.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to initialize upload',
        error: initResponse.error
      });
    }
    
    const uploadId = initResponse.data.data?.upload_id;
    
    if (!uploadId) {
      return res.status(400).json({
        success: false,
        message: 'No upload_id received'
      });
    }
    
    // Get upload URL
    const urlResponse = await getUploadUrl(req.user.tokens.access_token, uploadId);
    
    if (!urlResponse.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to get upload URL',
        error: urlResponse.error
      });
    }
    
    res.json({
      success: true,
      data: {
        upload_id: uploadId,
        upload_url: urlResponse.data?.data?.upload_url,
        expires_in: urlResponse.data?.data?.expires_in
      }
    });
    
  } catch (error) {
    console.error('Upload init error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize upload'
    });
  }
});

/**
 * @route   POST /api/tiktok/upload/binary
 * @desc    Upload binary video data to TikTok
 * @access  Private (requires TikTok connection)
 */
router.post('/upload/binary', auth, requireTikTok, async (req, res) => {
  try {
    const { upload_id, upload_url } = req.body;
    
    if (!upload_id || !upload_url) {
      return res.status(400).json({
        success: false,
        message: 'upload_id and upload_url are required'
      });
    }
    
    // Note: Binary upload should be done from frontend with presigned URL
    // This endpoint is for tracking purposes
    res.json({
      success: true,
      message: 'Use the upload_url to upload binary data directly',
      data: {
        upload_id,
        upload_url,
        method: 'POST',
        headers: {
          'Content-Type': 'video/mp4'
        }
      }
    });
    
  } catch (error) {
    console.error('Binary upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process binary upload request'
    });
  }
});

/**
 * @route   POST /api/tiktok/publish
 * @desc    Publish video on TikTok
 * @access  Private (requires TikTok connection)
 */
router.post('/publish', auth, requireTikTok, async (req, res) => {
  try {
    const { upload_id, title, description, privacy_level, disable_comment, disable_share } = req.body;
    
    if (!upload_id) {
      return res.status(400).json({
        success: false,
        message: 'upload_id is required'
      });
    }
    
    const { publishVideo } = require('../services/tiktok.service');
    
    const publishResponse = await publishVideo(req.user.tokens.access_token, {
      upload_id,
      post_mode: 'DIRECT_POST',
      title: (title || 'Video from PM3K').substring(0, 2200),
      description: (description || '').substring(0, 2200),
      privacy_level: privacy_level || 'PUBLIC',
      disable_comment: disable_comment || false,
      disable_share: disable_share || false,
      video_cover_timestamp_ms: 1000
    });
    
    if (!publishResponse.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to publish video',
        error: publishResponse.error
      });
    }
    
    res.json({
      success: true,
      message: 'Video published successfully',
      data: publishResponse.data
    });
    
  } catch (error) {
    console.error('Publish error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish video'
    });
  }
});

/**
 * @route   POST /api/tiktok/publish/status
 * @desc    Check video publish status
 * @access  Private (requires TikTok connection)
 */
router.post('/publish/status', auth, requireTikTok, async (req, res) => {
  try {
    const { creation_id } = req.body;
    
    if (!creation_id) {
      return res.status(400).json({
        success: false,
        message: 'creation_id is required'
      });
    }
    
    const { checkPublishStatus } = require('../services/tiktok.service');
    
    const statusResponse = await checkPublishStatus(req.user.tokens.access_token, creation_id);
    
    if (!statusResponse.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to check publish status',
        error: statusResponse.error
      });
    }
    
    res.json({
      success: true,
      data: statusResponse.data
    });
    
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check publish status'
    });
  }
});

module.exports = router;
