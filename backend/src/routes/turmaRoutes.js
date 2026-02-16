import express from 'express';
import { getTurmas, getCursosParaTurma, createTurma, updateTurma, deleteTurma, getTurmaById, importCurriculum } from '../controllers/turmaController.js';

import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getTurmas);
router.get('/cursos', getCursosParaTurma);
router.get('/:id', getTurmaById); // Validar ID

// Apenas Admin e Secretaria podem gerir turmas
router.post('/:id/import-curriculum', authorizeRole(['ADMIN', 'SECRETARIA']), importCurriculum);
router.post('/', authorizeRole(['ADMIN', 'SECRETARIA']), createTurma);
router.put('/:id', authorizeRole(['ADMIN', 'SECRETARIA']), updateTurma);
router.delete('/:id', authorizeRole(['ADMIN', 'SECRETARIA']), deleteTurma);

export default router;
