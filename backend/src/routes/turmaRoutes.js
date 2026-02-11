import express from 'express';
import { getTurmas, getCursosParaTurma, createTurma, updateTurma, deleteTurma, getTurmaById, importCurriculum } from '../controllers/turmaController.js';

import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getTurmas);
router.get('/cursos', getCursosParaTurma);
router.get('/:id', getTurmaById); // Validar ID
router.post('/:id/import-curriculum', importCurriculum);
router.post('/', createTurma);
router.put('/:id', updateTurma);
router.delete('/:id', deleteTurma);

export default router;
