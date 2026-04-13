import { Router } from 'express';
import authRoutes from './auth';
import taskRoutes from './tasks';
import noteRoutes from './notes';
import dashboardRoutes from './dashboard';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/notes', noteRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
