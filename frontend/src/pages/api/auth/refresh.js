import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import { authMiddleware } from '@/lib/auth';
import { refreshTikTokToken } from '@/lib/tiktok';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  await dbConnect();

  const decoded = authMiddleware(req);
  if (!decoded) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (!user.tokens.refresh_token) {
      return res.status(400).json({ success: false, message: 'No refresh token available' });
    }

    const refreshResponse = await refreshTikTokToken(user.tokens.refresh_token);
    
    if (!refreshResponse.success) {
      return res.status(400).json({ success: false, message: 'Failed to refresh TikTok token' });
    }

    const tokenData = refreshResponse.data;

    user.tokens.access_token = tokenData.access_token;
    if (tokenData.refresh_token) {
      user.tokens.refresh_token = tokenData.refresh_token;
    }
    user.tokens.expires_at = new Date(Date.now() + (tokenData.expires_in || 7200) * 1000);
    user.lastTokenRefresh = new Date();

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: { expires_at: user.tokens.expires_at }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Token refresh failed' });
  }
}
