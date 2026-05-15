import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import { authMiddleware } from '@/lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  await dbConnect();

  const decoded = authMiddleware(req);
  if (!decoded) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({ success: true, data: { user: user.toSafeObject() } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get user data' });
  }
}
