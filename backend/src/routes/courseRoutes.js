import express from 'express';
import { getCourses, createCourse, updateCourse, deleteCourse, getCourseModules, addModuleToCourse, removeModuleFromCourse, getPublicStats } from '../controllers/courseController.js';

const router = express.Router();

router.get('/stats', getPublicStats);
router.get('/', getCourses);
router.post('/', createCourse);
router.put('/:id', updateCourse);
router.delete('/:id', deleteCourse);

// Rotas de currículo
router.get('/:id/modules', getCourseModules);
router.post('/:id/modules', addModuleToCourse);
router.delete('/modules/:moduleId', removeModuleFromCourse);

export default router;
