import express from 'express';
import { getUsers, getUserById, updateUser, deleteUser } from '../controllers/userController.js';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// USER MANAGEMENT 
router.get('/', authenticateToken, authorizeRole(['ADMIN', 'SECRETARIA']), getUsers);
router.get('/:id', authenticateToken, authorizeRole(['ADMIN', 'SECRETARIA']), getUserById);
router.put('/:id', authenticateToken, authorizeRole(['ADMIN']), updateUser);
router.delete('/:id', authenticateToken, authorizeRole(['ADMIN']), deleteUser);

export default router;
