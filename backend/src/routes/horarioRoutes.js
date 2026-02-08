import express from 'express';
import { getTurmaSchedule, createLesson, deleteLesson, getFormadorSchedule, getRoomSchedule, listAllLessons, autoGenerateSchedule } from '../controllers/horarioController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/turma/:turmaId', getTurmaSchedule);
router.get('/formador/:userId', getFormadorSchedule);
router.get('/room/:roomId', getRoomSchedule);
router.get('/all', listAllLessons);
router.post('/', createLesson);
router.delete('/:id', deleteLesson);

// POST /api/schedules/generate/:turmaId
router.post('/generate/:turmaId', autoGenerateSchedule);

export default router;
