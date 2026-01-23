import express from 'express';
import { getTurmas, getCursosParaTurma, createTurma, updateTurma, deleteTurma } from '../controllers/turmaController.js';

const router = express.Router();

router.get('/', getTurmas);
router.get('/cursos', getCursosParaTurma);
router.post('/', createTurma);
router.put('/:id', updateTurma);
router.delete('/:id', deleteTurma);

export default router;
