// User Types
export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UserWithoutPassword {
  id: number;
  email: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

// Task Types
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'completed';

export interface Task {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority: TaskPriority;
  due_date?: Date;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  due_date?: Date;
}

// Note Types
export interface Note {
  id: number;
  user_id: number;
  task_id?: number;
  title: string;
  content: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateNoteInput {
  title: string;
  content: string;
  task_id?: number;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  task_id?: number;
}

// Dashboard Types
export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
  tasksByPriority: {
    low: number;
    medium: number;
    high: number;
  };
  weeklyActivity: {
    day: string;
    completed: number;
    created: number;
  }[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// JWT Payload
export interface JwtPayload {
  userId: number;
  email: string;
}

import type { Request } from 'express';

// Request with user (after auth middleware)
export interface AuthenticatedRequest extends Request {
  user?: UserWithoutPassword;
}
