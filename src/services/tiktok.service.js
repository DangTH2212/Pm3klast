const axios = require('axios');
const querystring = require('querystring');

/**
 * TikTok API Service
 * Handles all TikTok Content Posting API operations
 * Uses TikTok Sandbox Environment
 */

// TikTok API Base URLs
const TIKTOK_API_BASE = {
  sandbox: 'https://open-sandbox.tiktokapis.com',
  production: 'https://open.tiktokapis.com'
};

// Get the appropriate base URL based on environment
const getBaseUrl = () => {
  const env = process.env.TIKTOK_ENV || 'sandbox';
  return env === 'production' ? TIKTOK_API_BASE.production : TIKTOK_API_BASE.sandbox;
};

/**
 * Generate OAuth URL for TikTok login
 */
const getOAuthUrl = (state = 'random_state_string') => {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI;
  
  const scopes = [
    'user.info.basic',
    'video.upload',
    'video.publish',
    'video.publishwebhook'
  ].join(',');
  
  const params = querystring.stringify({
    client_key: clientKey,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
    state
  });
  
  return `${getBaseUrl()}/oauth/authorize/?${params}`;
};

/**
 * Exchange authorization code for access token
 */
const exchangeCodeForToken = async (code) => {
  try {
    const response = await axios.post(
      `${getBaseUrl()}/oauth/token/`,
      querystring.stringify({
        client_key: process.env.TIKTOK_CLIENT_KEY,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.TIKTOK_REDIRECT_URI
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Token exchange error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || { error: error.message }
    };
  }
};

/**
 * Refresh access token
 */
const refreshTikTokToken = async (user) => {
  try {
    const response = await axios.post(
      `${getBaseUrl()}/oauth/token/`,
      querystring.stringify({
        client_key: process.env.TIKTOK_CLIENT_KEY,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: user.tokens.refresh_token
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Token refresh error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || { error: error.message }
    };
  }
};

/**
 * Get user profile information
 */
const getUserProfile = async (accessToken) => {
  try {
    const response = await axios.post(
      `${getBaseUrl()}/user/info/`,
      {
        fields: ['open_id', 'union_id', 'display_name', 'avatar_url', 'bio', 'follower_count', 'following_count', 'video_count', 'likes_count']
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Get profile error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || { error: error.message }
    };
  }
};

/**
 * Initialize video upload
 * Step 1 of 2 for video upload
 */
const initializeUpload = async (accessToken, uploadRequest) => {
  try {
    const response = await axios.post(
      `${getBaseUrl()}/video/upload/init/`,
      {
        ...uploadRequest,
        // For sandbox, typically use test values
        source: process.env.TIKTOK_ENV === 'sandbox' ? 'FILE_UPLOAD' : (uploadRequest.source || 'FILE_UPLOAD')
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Initialize upload error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || { error: error.message }
    };
  }
};

/**
 * Get upload URL for binary upload
 * Step 2a of 2 for video upload
 */
const getUploadUrl = async (accessToken, uploadId) => {
  try {
    const response = await axios.post(
      `${getBaseUrl()}/video/upload/search/`,
      {
        upload_id: uploadId
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Get upload URL error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || { error: error.message }
    };
  }
};

/**
 * Upload binary video data to TikTok
 * Step 2b of 2 for video upload
 */
const uploadVideoBinary = async (uploadUrl, videoBuffer, contentType = 'video/mp4') => {
  try {
    // uploadUrl might be a full URL or just a path
    const url = uploadUrl.startsWith('http') 
      ? uploadUrl 
      : `${getBaseUrl()}${uploadUrl}`;
    
    const response = await axios.post(
      url,
      videoBuffer,
      {
        headers: {
          'Content-Type': contentType
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Upload binary error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || { error: error.message }
    };
  }
};

/**
 * Publish video
 * Step 3 of video upload process
 */
const publishVideo = async (accessToken, publishRequest) => {
  try {
    const response = await axios.post(
      `${getBaseUrl()}/video/publish/`,
      publishRequest,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Publish video error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || { error: error.message }
    };
  }
};

/**
 * Check video publish status
 */
const checkPublishStatus = async (accessToken, creationId) => {
  try {
    const response = await axios.post(
      `${getBaseUrl()}/video/publish/query/`,
      {
        creation_ids: [creationId]
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Check publish status error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || { error: error.message }
    };
  }
};

/**
 * Revoke token (logout)
 */
const revokeToken = async (accessToken) => {
  try {
    const response = await axios.post(
      `${getBaseUrl()}/oauth/revoke/`,
      {
        client_key: process.env.TIKTOK_CLIENT_KEY,
        token: accessToken
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Revoke token error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || { error: error.message }
    };
  }
};

module.exports = {
  getBaseUrl,
  getOAuthUrl,
  exchangeCodeForToken,
  refreshTikTokToken,
  getUserProfile,
  initializeUpload,
  getUploadUrl,
  uploadVideoBinary,
  publishVideo,
  checkPublishStatus,
  revokeToken,
  TIKTOK_API_BASE
};
