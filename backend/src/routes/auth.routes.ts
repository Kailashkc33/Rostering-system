import { Router } from 'express';
import { register, login, getProfile } from '../controllers/auth.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', verifyToken, getProfile);

export default router; 