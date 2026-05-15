const fs = require('fs');
const path = require('path');
const {
  initializeUpload,
  getUploadUrl,
  uploadVideoBinary,
  publishVideo
} = require('./tiktok.service');
const Video = require('../models/video.model');

/**
 * Upload Service
 * Handles complete video upload flow to TikTok
 */

/**
 * Complete video upload flow
 * 1. Initialize upload
 * 2. Get upload URL
 * 3. Upload binary data
 * 4. Publish video
 */
const uploadVideoToTikTok = async (user, videoData) => {
  const { videoPath, title, description, postSettings } = videoData;
  
  // Read video file
  let videoBuffer;
  try {
    videoBuffer = fs.readFileSync(videoPath);
  } catch (error) {
    throw new Error(`Failed to read video file: ${error.message}`);
  }
  
  const videoSize = videoBuffer.length;
  
  // Create video record in database
  let video;
  try {
    video = await Video.create({
      userId: user._id,
      title: title || path.parse(videoPath).name,
      description: description || '',
      localFile: {
        filename: path.basename(videoPath),
        originalName: path.basename(videoPath),
        path: videoPath,
        size: videoSize,
        mimeType: 'video/mp4'
      },
      postSettings: {
        privacy_level: postSettings?.privacy_level || 'PUBLIC',
        disable_comment: postSettings?.disable_comment || false,
        disable_share: postSettings?.disable_share || false
      },
      status: 'pending'
    });
  } catch (error) {
    throw new Error(`Failed to create video record: ${error.message}`);
  }
  
  try {
    // Update status to uploading
    video.status = 'uploading';
    await video.save();
    
    // Step 1: Initialize upload
    const initResponse = await initializeUpload(user.tokens.access_token, {
      upload_type: 'video',
      source: 'FILE_UPLOAD'
    });
    
    if (!initResponse.success) {
      throw new Error(initResponse.error?.error_description || 'Failed to initialize upload');
    }
    
    const uploadId = initResponse.data.data?.upload_id;
    
    if (!uploadId) {
      throw new Error('No upload_id received from TikTok');
    }
    
    // Save creation_id to video record
    video.postSettings.creation_id = uploadId;
    await video.save();
    
    // Step 2: Get upload URL
    const urlResponse = await getUploadUrl(user.tokens.access_token, uploadId);
    
    if (!urlResponse.success) {
      throw new Error(urlResponse.error?.error_description || 'Failed to get upload URL');
    }
    
    const uploadUrl = urlResponse.data.data?.upload_url;
    
    if (!uploadUrl) {
      throw new Error('No upload URL received from TikTok');
    }
    
    // Step 3: Upload binary video
    const uploadResponse = await uploadVideoBinary(uploadUrl, videoBuffer, 'video/mp4');
    
    if (!uploadResponse.success) {
      throw new Error(uploadResponse.error?.error_description || 'Failed to upload video binary');
    }
    
    // Update status to processing
    video.status = 'processing';
    await video.save();
    
    // Step 4: Publish video
    const publishRequest = {
      upload_id: uploadId,
      post_mode: 'DIRECT_POST',
      title: title?.substring(0, 2200) || 'Video from PM3K',
      description: description?.substring(0, 2200) || '',
      privacy_level: postSettings?.privacy_level || 'PUBLIC',
      disable_comment: postSettings?.disable_comment || false,
      disable_share: postSettings?.disable_share || false,
      video_cover_timestamp_ms: 1000
    };
    
    const publishResponse = await publishVideo(user.tokens.access_token, publishRequest);
    
    if (!publishResponse.success) {
      throw new Error(publishResponse.error?.error_description || 'Failed to publish video');
    }
    
    // Update video record with success
    video.status = 'published';
    video.tiktok.publish_id = publishResponse.data.data?.publish_id || uploadId;
    video.tiktok.share_url = publishResponse.data.data?.share_url || '';
    video.tiktok.video_id = publishResponse.data.data?.video_id || '';
    video.publishedAt = new Date();
    await video.save();
    
    return {
      success: true,
      video,
      publishId: video.tiktok.publish_id,
      shareUrl: video.tiktok.share_url
    };
    
  } catch (error) {
    // Update video record with error
    video.status = 'failed';
    video.error = {
      message: error.message,
      code: error.code || 'UPLOAD_ERROR',
      lastRetryAt: new Date()
    };
    await video.save();
    
    throw error;
  }
};

/**
 * Check upload status and retry if needed
 */
const checkAndRetryUpload = async (videoId, user) => {
  const video = await Video.findById(videoId);
  
  if (!video) {
    throw new Error('Video not found');
  }
  
  if (video.userId.toString() !== user._id.toString()) {
    throw new Error('Unauthorized');
  }
  
  if (video.status === 'published') {
    return {
      success: true,
      video,
      message: 'Video already published'
    };
  }
  
  if (video.status === 'processing' && video.postSettings.creation_id) {
    // Check status on TikTok
    const { checkPublishStatus } = require('./tiktok.service');
    const statusResponse = await checkPublishStatus(
      user.tokens.access_token,
      video.postSettings.creation_id
    );
    
    if (statusResponse.success && statusResponse.data?.data?.status) {
      const status = statusResponse.data.data.status;
      
      if (status === 'success') {
        video.status = 'published';
        video.tiktok.publish_id = video.postSettings.creation_id;
        await video.save();
        
        return {
          success: true,
          video,
          message: 'Video published successfully'
        };
      } else if (status === 'failed') {
        video.status = 'failed';
        video.error = {
          message: 'TikTok reported upload failed',
          code: 'TIKTOK_FAILED',
          lastRetryAt: new Date()
        };
        await video.save();
      }
    }
  }
  
  return {
    success: false,
    video,
    message: `Video status: ${video.status}`
  };
};

/**
 * Get videos for a user
 */
const getUserVideos = async (userId, options = {}) => {
  const { page = 1, limit = 20, status } = options;
  
  const query = { userId };
  if (status) {
    query.status = status;
  }
  
  const videos = await Video.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  
  const total = await Video.countDocuments(query);
  
  return {
    videos,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Delete video record (not from TikTok)
 */
const deleteVideoRecord = async (videoId, userId) => {
  const video = await Video.findOne({ _id: videoId, userId });
  
  if (!video) {
    throw new Error('Video not found');
  }
  
  await Video.deleteOne({ _id: videoId });
  
  return { success: true };
};

module.exports = {
  uploadVideoToTikTok,
  checkAndRetryUpload,
  getUserVideos,
  deleteVideoRecord
};
