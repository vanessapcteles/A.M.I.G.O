
import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import * as disponibilidadeController from '../controllers/disponibilidadeController.js';

const router = express.Router();

// GET /api/disponibilidades/all (Para Admin/Secretaria)
router.get('/all', authenticateToken, disponibilidadeController.getAllAvailabilities);

// GET /api/disponibilidades (retorna todas as minhas disponibilidades)
router.get('/', authenticateToken, disponibilidadeController.getMyAvailability);

// POST /api/disponibilidades (adiciona nova)
router.post('/', authenticateToken, disponibilidadeController.addAvailability);

// DELETE /api/disponibilidades/all (Limpar Tudo)
router.delete('/all', authenticateToken, disponibilidadeController.deleteAllAvailability);

// DELETE /api/disponibilidades/:id (remove)
router.delete('/:id', authenticateToken, disponibilidadeController.removeAvailability);

export default router;
