import axios from 'axios';
import { ApiResponse, User, Task, Note, DashboardStats, CreateTaskInput, UpdateTaskInput, CreateNoteInput, UpdateNoteInput, LoginInput, RegisterInput } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: RegisterInput) =>
    api.post<ApiResponse<{ user: User; token: string }>>('/auth/register', data),
  
  login: (data: LoginInput) =>
    api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', data),
  
  getMe: () =>
    api.get<ApiResponse<{ user: User }>>('/auth/me'),
};

// Tasks API
export const tasksApi = {
  getAll: () =>
    api.get<ApiResponse<{ tasks: Task[] }>>('/tasks'),
  
  create: (data: CreateTaskInput) =>
    api.post<ApiResponse<{ task: Task }>>('/tasks', data),
  
  update: (id: number, data: UpdateTaskInput) =>
    api.put<ApiResponse<{ task: Task }>>(`/tasks/${id}`, data),
  
  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/tasks/${id}`),
  
  toggleStatus: (id: number) =>
    api.patch<ApiResponse<{ task: Task }>>(`/tasks/${id}/toggle`),
};

// Notes API
export const notesApi = {
  getAll: () =>
    api.get<ApiResponse<{ notes: Note[] }>>('/notes'),
  
  create: (data: CreateNoteInput) =>
    api.post<ApiResponse<{ note: Note }>>('/notes', data),
  
  update: (id: number, data: UpdateNoteInput) =>
    api.put<ApiResponse<{ note: Note }>>(`/notes/${id}`, data),
  
  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/notes/${id}`),
};

// Dashboard API
export const dashboardApi = {
  getStats: () =>
    api.get<ApiResponse<DashboardStats>>('/dashboard/stats'),
};

export default api;
