import express from 'express';
import {
    getModules,
    createModule,
    updateModule,
    deleteModule,
    getModulesAreas,
    updateArea,
    deleteArea
} from '../controllers/moduleController.js';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Rotas públicas (apenas para ver módulos)
router.use(authenticateToken); // Todas as rotas requerem login

router.get('/areas', getModulesAreas); // Nova rota para áreas
router.put('/areas/:currentName', authorizeRole(['ADMIN', 'SECRETARIA']), updateArea); // Atualiza/Mescla área
router.delete('/areas/:areaName', authorizeRole(['ADMIN', 'SECRETARIA']), deleteArea); // Apaga área

router.get('/', getModules);
router.post('/', authorizeRole(['ADMIN', 'SECRETARIA']), createModule); // Cria módulo
router.put('/:id', authorizeRole(['ADMIN', 'SECRETARIA']), updateModule); // Atualiza módulo
router.delete('/:id', authorizeRole(['ADMIN', 'SECRETARIA']), deleteModule); // Apaga módulo

export default router;
