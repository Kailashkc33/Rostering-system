import { Router } from 'express';
import { createRoster, getRosters, getRosterById, createShift, updateShift, deleteShift, updateRoster, deleteRoster, getRosterShifts, getShiftById, copyRoster, getMyRosters } from '../controllers/roster.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// POST /api/rosters - Create a new roster
router.post('/rosters', verifyToken, createRoster);
// GET /api/rosters - List all rosters
router.get('/rosters', verifyToken, getRosters);
router.get('/rosters/:id', verifyToken, getRosterById);
router.get('/rosters/:id/shifts', verifyToken, getRosterShifts);
router.post('/rosters/:rosterId/shifts', verifyToken, createShift);
router.get('/shifts/:id', verifyToken, getShiftById);
router.put('/shifts/:id', verifyToken, updateShift);
router.delete('/shifts/:id', verifyToken, deleteShift);
router.put('/rosters/:id', verifyToken, updateRoster);
router.delete('/rosters/:id', verifyToken, deleteRoster);
router.post('/rosters/:id/copy', verifyToken, copyRoster);
// GET /api/rosters/my - Staff fetch their approved rosters
router.get('/rosters/my', verifyToken, getMyRosters);

export default router; 