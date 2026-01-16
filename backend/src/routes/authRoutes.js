import express from 'express';
import passport from 'passport';
import {
    register, login, updateUser, deleteUser, getUsers, getUserById,
    setup2FA, verify2FA, validate2FA, recover2FA, disable2FA,
    activateAccount, forgotPassword, resetPassword
} from '../controllers/authControllers.js';
import { generateToken } from '../utils/token.js';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';


const router = express.Router();

// --- AUTH LOCAL ---
router.post('/register', register);
router.post('/login', login);
router.get('/activate', activateAccount); // GET para o link do email
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
// --- USER MANAGEMENT ---
router.get('/user', authenticateToken, authorizeRole(['ADMIN', 'SECRETARIA']), getUsers);

router.get('/user/:id', authenticateToken, authorizeRole(['ADMIN', 'SECRETARIA']), getUserById);
router.put('/user/:id', authenticateToken, authorizeRole(['ADMIN']), updateUser);
router.delete('/user/:id', authenticateToken, authorizeRole(['ADMIN']), deleteUser);

// --- AUTH 2FA ---
router.post('/2fa/setup', setup2FA);       // Gera o QR Code
router.post('/2fa/verify', verify2FA);     // Ativa o 2FA
router.post('/2fa/validate', validate2FA); // Valida no login
router.post('/2fa/recover', recover2FA);   // Enviar email
router.post('/2fa/disable', disable2FA);   // Confirmar via token


// --- AUTH GOOGLE ---
// Inicia a autenticação: http://localhost:3001/api/auth/google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Callback do Google: http://localhost:3001/api/auth/google/callback
router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    (req, res) => {
        // Redirecionamento dinâmico
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const nameEncoded = encodeURIComponent(req.user.nome_completo || req.user.nome || '');

        // 1. Se tem 2FA ativado
        if (req.user.two_fa_enabled === 1 || req.user.two_fa_enabled === true) {
            // Redireciona para o login a pedir o código, SEM enviar o token de sessão ainda
            return res.redirect(`${frontendUrl}/login?requires2FA=true&email=${req.user.email}&name=${nameEncoded}`);
        }

        // 2. Login normal (sem 2FA)
        // Encode URI components to handle spaces/special chars in names

        // Gerar token real
        const userObj = {
            id: req.user.id,
            nome_completo: req.user.nome_completo || req.user.nome,
            email: req.user.email,
            tipo_utilizador: req.user.tipo_utilizador
        };
        const token = generateToken(userObj);

        res.redirect(`${frontendUrl}/login?token=${token}&user=${req.user.email}&name=${nameEncoded}&id=${req.user.id}`);
    }
);

export default router;



