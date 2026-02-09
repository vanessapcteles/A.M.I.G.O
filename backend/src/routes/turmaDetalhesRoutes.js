import express from 'express';
import { getTurmaModules, addModuleToTurma, removeModuleFromTurma, getTurmaFormandos, updateTurmaModule } from '../controllers/turmaDetalhesController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

// /api/turma-details/:turmaId
router.get('/:turmaId', getTurmaModules);
router.post('/:turmaId', addModuleToTurma);
router.delete('/:detalheId', removeModuleFromTurma);
router.put('/:detalheId', updateTurmaModule);

// /api/turma-details/:turmaId/formandos
router.get('/:turmaId/formandos', getTurmaFormandos);

export default router;
