import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import { exchangeCodeForToken, getUserProfile } from '@/lib/tiktok';
import { generateToken } from '@/lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { code, state } = req.body;
    
    if (!code) {
      return res.status(400).json({ success: false, message: 'Authorization code is required' });
    }

    const tokenResponse = await exchangeCodeForToken(code);
    
    if (!tokenResponse.success) {
      return res.status(400).json({
        success: false,
        message: tokenResponse.error?.error_description || 'Failed to exchange code for token'
      });
    }

    const tokenData = tokenResponse.data;

    const profileResponse = await getUserProfile(tokenData.access_token);
    
    if (!profileResponse.success) {
      return res.status(400).json({ success: false, message: 'Failed to get user profile from TikTok' });
    }

    const tiktokProfile = profileResponse.data.data;

    const expiresAt = new Date(Date.now() + (tokenData.expires_in || 7200) * 1000);
    const refreshExpiresAt = new Date(Date.now() + (tokenData.refresh_expires_in || 86400) * 1000);

    let user = await User.findOne({ 'tiktok.open_id': tiktokProfile.open_id });

    if (user) {
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
      user = new User({
        email: `${tiktokProfile.open_id}@tiktok.sandbox`,
        password: generateToken(tiktokProfile.open_id),
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

    const jwtToken = generateToken(user._id.toString());

    return res.status(200).json({
      success: true,
      message: 'TikTok account connected successfully',
      data: {
        token: jwtToken,
        user: user.toSafeObject()
      }
    });

  } catch (error) {
    console.error('TikTok OAuth callback error:', error);
    return res.status(500).json({ success: false, message: 'OAuth callback processing failed' });
  }
}
