import jwt from 'jsonwebtoken';

export function generateToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'fallback_secret_for_dev',
    { expiresIn: '7d' }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_dev');
  } catch (error) {
    return null;
  }
}

export function authMiddleware(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.replace('Bearer ', '');
  return verifyToken(token);
}
