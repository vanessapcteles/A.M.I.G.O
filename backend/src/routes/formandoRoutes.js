import express from 'express';
import { getFormandoProfile, updateFormandoProfile, listFormandos, getFormandoAcademicRecord, assignTurma } from '../controllers/formandoController.js';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', listFormandos);
router.get('/:userId/profile', getFormandoProfile);
router.get('/:userId/academic', getFormandoAcademicRecord);
router.put('/:userId/profile', updateFormandoProfile);
router.post('/:userId/enroll', assignTurma);

export default router;
