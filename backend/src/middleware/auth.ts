import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserWithoutPassword } from '../types';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';
import pool from '../utils/db';

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'Access denied. No token provided.' });
    }

    const decoded = verifyToken(token);
    
    // Fetch user from database to ensure they still exist
    const [rows] = await pool.execute(
      'SELECT id, email, name, created_at, updated_at FROM users WHERE id = ?',
      [decoded.userId]
    );
    
    const users = rows as UserWithoutPassword[];
    
    if (users.length === 0) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
}
