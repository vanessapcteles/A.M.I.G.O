import express from 'express';
import { submitCandidacy, getCandidacies, approveCandidacy, rejectCandidacy, getMyCandidacy } from '../controllers/CandidatosController.js';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Publico ou Utilizador rotas (Candidato a submeter candidatura)
router.post('/submit', authenticateToken, submitCandidacy);
router.get('/me', authenticateToken, getMyCandidacy);

// Admin/Secretaria rotas (Candidaturas a analisar)
router.get('/', authenticateToken, authorizeRole(['ADMIN', 'SECRETARIA']), getCandidacies);
router.post('/:id/approve', authenticateToken, authorizeRole(['ADMIN', 'SECRETARIA']), approveCandidacy);
router.post('/:id/reject', authenticateToken, authorizeRole(['ADMIN', 'SECRETARIA']), rejectCandidacy);

export default router;
