import { Response } from 'express';
import { z } from 'zod';
import pool from '../utils/db';
import { AuthenticatedRequest, Task, ApiResponse, CreateTaskInput, UpdateTaskInput } from '../types';

// Validation schemas
const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  due_date: z.string().datetime().optional().nullable(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  status: z.enum(['pending', 'completed']).optional(),
  due_date: z.string().datetime().optional().nullable(),
});

export async function getTasks(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { status, priority } = req.query;

    let query = 'SELECT * FROM tasks WHERE user_id = ?';
    const params: any[] = [userId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (priority) {
      query += ' AND priority = ?';
      params.push(priority);
    }

    query += ' ORDER BY created_at DESC';

    const [tasks] = await pool.execute(query, params);

    res.json({
      success: true,
      data: { tasks: tasks as Task[] },
    } as ApiResponse<{ tasks: Task[] }>);

  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tasks',
    } as ApiResponse<null>);
  }
}

export async function createTask(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const validation = createTaskSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: validation.error.errors[0].message,
      } as ApiResponse<null>);
    }

    const { title, description, priority, due_date } = validation.data;

    const [result] = await pool.execute(
      'INSERT INTO tasks (user_id, title, description, priority, due_date) VALUES (?, ?, ?, ?, ?)',
      [userId, title, description || null, priority, due_date || null]
    );

    const taskId = (result as any).insertId;

    const [tasks] = await pool.execute(
      'SELECT * FROM tasks WHERE id = ?',
      [taskId]
    );

    res.status(201).json({
      success: true,
      data: { task: (tasks as Task[])[0] },
      message: 'Task created successfully',
    } as ApiResponse<{ task: Task }>);

  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create task',
    } as ApiResponse<null>);
  }
}

export async function updateTask(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const taskId = parseInt(req.params.id);

    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid task ID',
      } as ApiResponse<null>);
    }

    const validation = updateTaskSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: validation.error.errors[0].message,
      } as ApiResponse<null>);
    }

    // Check if task exists and belongs to user
    const [existingTasks] = await pool.execute(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, userId]
    );

    if ((existingTasks as Task[]).length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      } as ApiResponse<null>);
    }

    const updates = validation.data;
    const updateFields: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) {
      updateFields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      updateFields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.priority !== undefined) {
      updateFields.push('priority = ?');
      values.push(updates.priority);
    }
    if (updates.status !== undefined) {
      updateFields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.due_date !== undefined) {
      updateFields.push('due_date = ?');
      values.push(updates.due_date);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
      } as ApiResponse<null>);
    }

    values.push(taskId);

    await pool.execute(
      `UPDATE tasks SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );

    const [tasks] = await pool.execute(
      'SELECT * FROM tasks WHERE id = ?',
      [taskId]
    );

    res.json({
      success: true,
      data: { task: (tasks as Task[])[0] },
      message: 'Task updated successfully',
    } as ApiResponse<{ task: Task }>);

  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update task',
    } as ApiResponse<null>);
  }
}

export async function deleteTask(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const taskId = parseInt(req.params.id);

    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid task ID',
      } as ApiResponse<null>);
    }

    // Check if task exists and belongs to user
    const [existingTasks] = await pool.execute(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, userId]
    );

    if ((existingTasks as Task[]).length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      } as ApiResponse<null>);
    }

    await pool.execute('DELETE FROM tasks WHERE id = ?', [taskId]);

    res.json({
      success: true,
      message: 'Task deleted successfully',
    } as ApiResponse<null>);

  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete task',
    } as ApiResponse<null>);
  }
}

export async function toggleTaskStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const taskId = parseInt(req.params.id);

    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid task ID',
      } as ApiResponse<null>);
    }

    // Get current status
    const [tasks] = await pool.execute(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, userId]
    );

    const taskList = tasks as Task[];
    if (taskList.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      } as ApiResponse<null>);
    }

    const newStatus = taskList[0].status === 'completed' ? 'pending' : 'completed';

    await pool.execute(
      'UPDATE tasks SET status = ? WHERE id = ?',
      [newStatus, taskId]
    );

    const [updatedTasks] = await pool.execute(
      'SELECT * FROM tasks WHERE id = ?',
      [taskId]
    );

    res.json({
      success: true,
      data: { task: (updatedTasks as Task[])[0] },
      message: 'Task status updated',
    } as ApiResponse<{ task: Task }>);

  } catch (error) {
    console.error('Toggle task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle task status',
    } as ApiResponse<null>);
  }
}
