import express from 'express';
import { getFormadorProfile, updateFormadorProfile, listFormadores, getFormadorHistory } from '../controllers/formadorController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', listFormadores);
router.get('/:userId/profile', getFormadorProfile);
router.get('/:userId/history', getFormadorHistory);
router.put('/:userId/profile', updateFormadorProfile);

export default router;
