import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import pool from '../utils/db';
import { generateToken } from '../utils/jwt';
import { AuthenticatedRequest, User, CreateUserInput, LoginInput, ApiResponse, UserWithoutPassword } from '../types';

const SALT_ROUNDS = 10;

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function register(req: Request, res: Response) {
  try {
    // Validate input
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: validation.error.errors[0].message,
      } as ApiResponse<null>);
    }

    const { email, password, name } = validation.data;

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if ((existingUsers as any[]).length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered',
      } as ApiResponse<null>);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const [result] = await pool.execute(
      'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
      [email, hashedPassword, name]
    );

    const userId = (result as any).insertId;

    // Generate token
    const token = generateToken({ userId, email });

    // Return user data (without password)
    const userData: UserWithoutPassword = {
      id: userId,
      email,
      name,
      created_at: new Date(),
      updated_at: new Date(),
    };

    res.status(201).json({
      success: true,
      data: { user: userData, token },
      message: 'User registered successfully',
    } as ApiResponse<{ user: UserWithoutPassword; token: string }>);

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register user',
    } as ApiResponse<null>);
  }
}

export async function login(req: Request, res: Response) {
  try {
    // Validate input
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: validation.error.errors[0].message,
      } as ApiResponse<null>);
    }

    const { email, password } = validation.data;

    // Find user
    const [users] = await pool.execute(
      'SELECT id, email, password, name, created_at, updated_at FROM users WHERE email = ?',
      [email]
    );

    const userList = users as User[];

    if (userList.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      } as ApiResponse<null>);
    }

    const user = userList[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      } as ApiResponse<null>);
    }

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email });

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: { user: userWithoutPassword, token },
      message: 'Login successful',
    } as ApiResponse<{ user: UserWithoutPassword; token: string }>);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to login',
    } as ApiResponse<null>);
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      data: { user: req.user },
    } as ApiResponse<{ user: UserWithoutPassword }>);

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user data',
    } as ApiResponse<null>);
  }
}
