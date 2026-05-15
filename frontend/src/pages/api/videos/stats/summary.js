import dbConnect from '@/lib/db';
import Video from '@/models/video.model';
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
    const stats = await Video.aggregate([
      { $match: { userId: decoded.userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const totalVideos = await Video.countDocuments({ userId: decoded.userId });

    const summary = { total: totalVideos, byStatus: {}, totalSize: 0 };
    stats.forEach(stat => {
      summary.byStatus[stat._id] = stat.count;
    });

    return res.status(200).json({ success: true, data: { stats: summary } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get statistics' });
  }
}
