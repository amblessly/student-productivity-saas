import { Response } from 'express';
import { z } from 'zod';
import pool from '../utils/db';
import { AuthenticatedRequest, Note, ApiResponse } from '../types';

// Validation schemas
const createNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  content: z.string().min(1, 'Content is required'),
  task_id: z.number().int().optional().nullable(),
});

const updateNoteSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).optional(),
  task_id: z.number().int().optional().nullable(),
});

export async function getNotes(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const [notes] = await pool.execute(
      `SELECT n.*, t.title as task_title 
       FROM notes n 
       LEFT JOIN tasks t ON n.task_id = t.id 
       WHERE n.user_id = ? 
       ORDER BY n.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: { notes: notes as Note[] },
    } as ApiResponse<{ notes: Note[] }>);

  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notes',
    } as ApiResponse<null>);
  }
}

export async function createNote(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const validation = createNoteSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: validation.error.errors[0].message,
      } as ApiResponse<null>);
    }

    const { title, content, task_id } = validation.data;

    // If task_id is provided, verify it belongs to the user
    if (task_id) {
      const [tasks] = await pool.execute(
        'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
        [task_id, userId]
      );
      
      if ((tasks as any[]).length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Task not found',
        } as ApiResponse<null>);
      }
    }

    const [result] = await pool.execute(
      'INSERT INTO notes (user_id, task_id, title, content) VALUES (?, ?, ?, ?)',
      [userId, task_id || null, title, content]
    );

    const noteId = (result as any).insertId;

    const [notes] = await pool.execute(
      'SELECT * FROM notes WHERE id = ?',
      [noteId]
    );

    res.status(201).json({
      success: true,
      data: { note: (notes as Note[])[0] },
      message: 'Note created successfully',
    } as ApiResponse<{ note: Note }>);

  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create note',
    } as ApiResponse<null>);
  }
}

export async function updateNote(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const noteId = parseInt(req.params.id);

    if (isNaN(noteId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid note ID',
      } as ApiResponse<null>);
    }

    const validation = updateNoteSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: validation.error.errors[0].message,
      } as ApiResponse<null>);
    }

    // Check if note exists and belongs to user
    const [existingNotes] = await pool.execute(
      'SELECT * FROM notes WHERE id = ? AND user_id = ?',
      [noteId, userId]
    );

    if ((existingNotes as Note[]).length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Note not found',
      } as ApiResponse<null>);
    }

    const updates = validation.data;

    // If task_id is being updated, verify it belongs to the user
    if (updates.task_id !== undefined && updates.task_id !== null) {
      const [tasks] = await pool.execute(
        'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
        [updates.task_id, userId]
      );
      
      if ((tasks as any[]).length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Task not found',
        } as ApiResponse<null>);
      }
    }

    const updateFields: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) {
      updateFields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.content !== undefined) {
      updateFields.push('content = ?');
      values.push(updates.content);
    }
    if (updates.task_id !== undefined) {
      updateFields.push('task_id = ?');
      values.push(updates.task_id);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
      } as ApiResponse<null>);
    }

    values.push(noteId);

    await pool.execute(
      `UPDATE notes SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );

    const [notes] = await pool.execute(
      'SELECT * FROM notes WHERE id = ?',
      [noteId]
    );

    res.json({
      success: true,
      data: { note: (notes as Note[])[0] },
      message: 'Note updated successfully',
    } as ApiResponse<{ note: Note }>);

  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update note',
    } as ApiResponse<null>);
  }
}

export async function deleteNote(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const noteId = parseInt(req.params.id);

    if (isNaN(noteId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid note ID',
      } as ApiResponse<null>);
    }

    // Check if note exists and belongs to user
    const [existingNotes] = await pool.execute(
      'SELECT * FROM notes WHERE id = ? AND user_id = ?',
      [noteId, userId]
    );

    if ((existingNotes as Note[]).length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Note not found',
      } as ApiResponse<null>);
    }

    await pool.execute('DELETE FROM notes WHERE id = ?', [noteId]);

    res.json({
      success: true,
      message: 'Note deleted successfully',
    } as ApiResponse<null>);

  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete note',
    } as ApiResponse<null>);
  }
}
