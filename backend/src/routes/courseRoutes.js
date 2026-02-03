import express from 'express';
import { getCourses, createCourse, updateCourse, deleteCourse, getCourseModules, addModuleToCourse, removeModuleFromCourse } from '../controllers/courseController.js';

const router = express.Router();

router.get('/', getCourses);
router.post('/', createCourse);
router.put('/:id', updateCourse);
router.delete('/:id', deleteCourse);

// Curriculum Routes
router.get('/:id/modules', getCourseModules);
router.post('/:id/modules', addModuleToCourse);
// Note: delete uses absolute path /api/courses/modules/:id or nested /:id/modules/:moduleId
// Let's use /modules/:moduleId to be clean if we use the connection ID
router.delete('/modules/:moduleId', removeModuleFromCourse);

export default router;
