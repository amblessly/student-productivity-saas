import { Response } from 'express';
import pool from '../utils/db';
import { AuthenticatedRequest, ApiResponse, DashboardStats } from '../types';

export async function getDashboardStats(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;

    // Get total tasks counts
    const [taskCounts] = await pool.execute(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN priority = 'low' THEN 1 ELSE 0 END) as low_count,
        SUM(CASE WHEN priority = 'medium' THEN 1 ELSE 0 END) as medium_count,
        SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high_count
      FROM tasks 
      WHERE user_id = ?`,
      [userId]
    );

    const counts = (taskCounts as any[])[0];
    const totalTasks = parseInt(counts.total) || 0;
    const completedTasks = parseInt(counts.completed) || 0;
    const pendingTasks = parseInt(counts.pending) || 0;

    // Get weekly activity (last 7 days)
    const [weeklyData] = await pool.execute(
      `SELECT 
        DATE(created_at) as day,
        COUNT(*) as created_count
      FROM tasks 
      WHERE user_id = ? 
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY day`,
      [userId]
    );

    const [weeklyCompleted] = await pool.execute(
      `SELECT 
        DATE(updated_at) as day,
        COUNT(*) as completed_count
      FROM tasks 
      WHERE user_id = ? 
        AND status = 'completed'
        AND updated_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(updated_at)
      ORDER BY day`,
      [userId]
    );

    // Build weekly activity array
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyActivity = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = days[date.getDay()];

      const createdEntry = (weeklyData as any[]).find(d => d.day === dateStr);
      const completedEntry = (weeklyCompleted as any[]).find(d => d.day === dateStr);

      weeklyActivity.push({
        day: dayName,
        completed: parseInt(completedEntry?.completed_count || 0),
        created: parseInt(createdEntry?.created_count || 0),
      });
    }

    const stats: DashboardStats = {
      totalTasks,
      completedTasks,
      pendingTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      tasksByPriority: {
        low: parseInt(counts.low_count) || 0,
        medium: parseInt(counts.medium_count) || 0,
        high: parseInt(counts.high_count) || 0,
      },
      weeklyActivity,
    };

    res.json({
      success: true,
      data: stats,
    } as ApiResponse<DashboardStats>);

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard stats',
    } as ApiResponse<null>);
  }
}
