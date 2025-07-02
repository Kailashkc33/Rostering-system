import { Router } from 'express';
import { getStaff, getUsers, getUserById, updateUser, createUser, deleteUser, getMyShifts, getMyClockLogs } from '../controllers/user.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/staff', verifyToken, getStaff);
router.get('/users', verifyToken, getUsers);
router.get('/users/:id', verifyToken, getUserById);
router.put('/users/:id', verifyToken, updateUser);
router.post('/users', verifyToken, createUser);
router.delete('/users/:id', verifyToken, deleteUser);
router.get('/my-shifts', verifyToken, getMyShifts);
router.get('/my-clocklogs', verifyToken, getMyClockLogs);

export default router; 