import express from 'express';
import { getTurmaSchedule, createLesson, deleteLesson, deleteAllTurmaSchedule, getFormadorSchedule, getRoomSchedule, listAllLessons, autoGenerateSchedule } from '../controllers/horarioController.js';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/turma/:turmaId', getTurmaSchedule);
router.get('/formador/:userId', getFormadorSchedule);
router.get('/room/:roomId', getRoomSchedule);
router.get('/all', authenticateToken, listAllLessons);

// Modificação de Horários - Apenas Admin e Secretaria
router.post('/', authenticateToken, authorizeRole(['ADMIN', 'SECRETARIA']), createLesson);
router.delete('/turma/:turmaId', authenticateToken, authorizeRole(['ADMIN', 'SECRETARIA']), deleteAllTurmaSchedule);
router.delete('/:id', authenticateToken, authorizeRole(['ADMIN', 'SECRETARIA']), deleteLesson);

// POST /api/schedules/generate/:turmaId
router.post('/generate/:turmaId', authenticateToken, authorizeRole(['ADMIN', 'SECRETARIA']), autoGenerateSchedule);

export default router;
