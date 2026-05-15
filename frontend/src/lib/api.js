import axios from 'axios';

// API base URL - uses env var or relative path for Vercel proxy
const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || '/api';
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('pm3k_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pm3k_token');
        localStorage.removeItem('pm3k_user');
        
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Auto-refresh token before expiry (5 minutes before)
let tokenRefreshTimer = null;

export const startTokenRefreshTimer = (expiresAt) => {
  if (!expiresAt || typeof window === 'undefined') return;
  
  const expiresTime = new Date(expiresAt).getTime();
  const refreshTime = expiresTime - (5 * 60 * 1000);
  const now = Date.now();
  const delay = refreshTime - now;
  
  if (delay > 0) {
    if (tokenRefreshTimer) clearTimeout(tokenRefreshTimer);
    
    tokenRefreshTimer = setTimeout(async () => {
      try {
        const response = await api.post('/auth/refresh');
        if (response.data?.success) {
          console.log('Token auto-refreshed');
        }
      } catch (error) {
        console.error('Auto token refresh failed:', error);
      }
    }, delay);
  }
};

export const stopTokenRefreshTimer = () => {
  if (tokenRefreshTimer) {
    clearTimeout(tokenRefreshTimer);
    tokenRefreshTimer = null;
  }
};

// Auth API
export const authApi = {
  getOAuthUrl: () => api.get('/auth/oauth-url'),
  tiktokCallback: (code, state) => api.post('/auth/tiktok-callback', { code, state }),
  getMe: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh'),
  logout: (options = {}) => api.post('/auth/logout', options)
};

// Videos API
export const videosApi = {
  getVideos: (params = {}) => api.get('/videos', { params }),
  getVideo: (id) => api.get(`/videos/${id}`),
  getStats: () => api.get('/videos/stats/summary'),
  deleteVideo: (id) => api.delete(`/videos/${id}`)
};

// Profile API
export const profileApi = {
  getProfile: () => api.get('/profile'),
  getCachedTikTokProfile: () => api.get('/profile/tiktok-cached')
};

// Health check
export const healthApi = {
  check: () => api.get('/health')
};

// TikTok Upload API
export const tiktokApi = {
  uploadVideo: (formData, onUploadProgress) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('pm3k_token') : '';
    return axios.post('/api/tiktok/upload', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      },
      timeout: 120000,
      onUploadProgress
    });
  }
};

export default api;
