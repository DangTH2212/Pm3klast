import dbConnect from '@/lib/db';
import Video from '@/models/video.model';
import { authMiddleware } from '@/lib/auth';

export default async function handler(req, res) {
  await dbConnect();

  const { id } = req.query;

  if (req.method === 'GET') {
    const decoded = authMiddleware(req);
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const video = await Video.findOne({ _id: id, userId: decoded.userId });
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }
    return res.status(200).json({ success: true, data: { video } });
  }

  if (req.method === 'DELETE') {
    const decoded = authMiddleware(req);
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const video = await Video.findOneAndDelete({ _id: id, userId: decoded.userId });
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }
    return res.status(200).json({ success: true, message: 'Video deleted successfully' });
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}
