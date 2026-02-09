import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todos podem ver estatísticas, exceto Candidatos (que nem têm acesso ao dashboard pelo front)
router.get('/stats', authenticateToken, authorizeRole(['ADMIN', 'SECRETARIA', 'FORMADOR', 'FORMANDO']), getDashboardStats);

export default router;
