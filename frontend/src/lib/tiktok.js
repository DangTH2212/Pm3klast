import axios from 'axios';

const TIKTOK_API_BASE = {
  sandbox: 'https://open-sandbox.tiktokapis.com',
  production: 'https://open.tiktokapis.com'
};

const getBaseUrl = () => {
  const env = process.env.TIKTOK_ENV || 'sandbox';
  return env === 'production' ? TIKTOK_API_BASE.production : TIKTOK_API_BASE.sandbox;
};

export const getOAuthUrl = (state = 'random_state_string') => {
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY,
    redirect_uri: process.env.TIKTOK_REDIRECT_URI,
    response_type: 'code',
    scope: 'user.info.basic,video.upload,video.publish',
    state
  });
  return `${getBaseUrl()}/oauth/authorize/?${params}`;
};

export const exchangeCodeForToken = async (code) => {
  try {
    const response = await axios.post(
      `${getBaseUrl()}/oauth/token/`,
      new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.TIKTOK_REDIRECT_URI
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || { error: error.message } };
  }
};

export const refreshTikTokToken = async (refreshToken) => {
  try {
    const response = await axios.post(
      `${getBaseUrl()}/oauth/token/`,
      new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || { error: error.message } };
  }
};

export const getUserProfile = async (accessToken) => {
  try {
    const response = await axios.post(
      `${getBaseUrl()}/user/info/`,
      { fields: ['open_id', 'union_id', 'display_name', 'avatar_url', 'bio', 'follower_count', 'following_count', 'video_count', 'likes_count'] },
      { headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || { error: error.message } };
  }
};

export const initializeUpload = async (accessToken) => {
  try {
    const response = await axios.post(
      `${getBaseUrl()}/video/upload/init/`,
      { upload_type: 'video', source: 'FILE_UPLOAD' },
      { headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || { error: error.message } };
  }
};

export const getUploadUrl = async (accessToken, uploadId) => {
  try {
    const response = await axios.post(
      `${getBaseUrl()}/video/upload/search/`,
      { upload_id: uploadId },
      { headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || { error: error.message } };
  }
};

export const publishVideo = async (accessToken, publishRequest) => {
  try {
    const response = await axios.post(
      `${getBaseUrl()}/video/publish/`,
      publishRequest,
      { headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || { error: error.message } };
  }
};

export default {
  getOAuthUrl,
  exchangeCodeForToken,
  refreshTikTokToken,
  getUserProfile,
  initializeUpload,
  getUploadUrl,
  publishVideo
};
