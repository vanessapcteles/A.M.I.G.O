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

// Public routes (or protected if needed)
router.use(authenticateToken); // All routes require login

router.get('/areas', getModulesAreas); // New route for areas
router.put('/areas/:currentName', authorizeRole(['ADMIN', 'SECRETARIA']), updateArea); // Update/Merge Area
router.delete('/areas/:areaName', authorizeRole(['ADMIN', 'SECRETARIA']), deleteArea); // Delete Area (Cascade)

router.get('/', getModules);
router.post('/', authorizeRole(['ADMIN', 'SECRETARIA']), createModule);
router.put('/:id', authorizeRole(['ADMIN', 'SECRETARIA']), updateModule);
router.delete('/:id', authorizeRole(['ADMIN', 'SECRETARIA']), deleteModule);

export default router;
