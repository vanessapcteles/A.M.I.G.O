
import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import * as evaluationController from '../controllers/evaluationController.js';

const router = express.Router();

// GET /api/evaluations/turma/:turmaId/module/:moduloId
router.get('/turma/:turmaId/module/:moduloId', authenticateToken, evaluationController.getStudentsForEvaluation);

// POST /api/evaluations/submit
router.post('/submit', authenticateToken, evaluationController.submitGrades);

export default router;
