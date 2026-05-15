import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import { getOAuthUrl } from '@/lib/tiktok';
import { generateToken } from '@/lib/auth';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    const state = generateToken(Date.now().toString());
    const url = getOAuthUrl(state);
    return res.status(200).json({ success: true, data: { url, state } });
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}
