import express from 'express';
import { getTurmaModules, addModuleToTurma, removeModuleFromTurma, getTurmaFormandos, updateTurmaModule } from '../controllers/turmaDetalhesController.js';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

// /api/turma-details/:turmaId
// /api/turma-details/:turmaId
router.get('/:turmaId', getTurmaModules);
router.post('/:turmaId', authorizeRole(['ADMIN', 'SECRETARIA']), addModuleToTurma);
router.delete('/:detalheId', authorizeRole(['ADMIN', 'SECRETARIA']), removeModuleFromTurma);
router.put('/:detalheId', authorizeRole(['ADMIN', 'SECRETARIA']), updateTurmaModule);

// /api/turma-details/:turmaId/formandos
router.get('/:turmaId/formandos', getTurmaFormandos);

export default router;
