import express from 'express';
import { register } from '../controllers/authControllers.js';

const router = express.Router();

// Rota para registar utilizador: http://localhost:3001/api/auth/register
router.post('/register', register);

export default router;
