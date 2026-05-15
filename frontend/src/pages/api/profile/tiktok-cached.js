import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import { authMiddleware } from '@/lib/auth';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const decoded = authMiddleware(req);
  if (!decoded) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.tiktok.open_id) {
      return res.status(404).json({ success: false, message: 'No TikTok account connected' });
    }

    return res.status(200).json({
      success: true,
      data: {
        profile: {
          open_id: user.tiktok.open_id,
          union_id: user.tiktok.union_id,
          display_name: user.tiktok.display_name,
          avatar_url: user.tiktok.avatar_url,
          bio: user.tiktok.bio,
          follower_count: user.tiktok.follower_count,
          following_count: user.tiktok.following_count,
          video_count: user.tiktok.video_count,
          likes_count: user.tiktok.likes_count
        },
        tokenStatus: {
          hasToken: !!user.tokens.access_token,
          isExpired: user.isTokenExpired(),
          expiresAt: user.tokens.expires_at,
          lastRefresh: user.lastTokenRefresh
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get cached profile' });
  }
}
