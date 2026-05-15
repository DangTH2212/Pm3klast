import dbConnect from '@/lib/db';
import Video from '@/models/video.model';
import { authMiddleware } from '@/lib/auth';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    const decoded = authMiddleware(req);
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { page = 1, limit = 20, status } = req.query;
    
    const query = { userId: decoded.userId };
    if (status) {
      query.status = status;
    }

    const videos = await Video.find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(Math.min(parseInt(limit), 100));

    const total = await Video.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: {
        videos,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
      }
    });
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}
