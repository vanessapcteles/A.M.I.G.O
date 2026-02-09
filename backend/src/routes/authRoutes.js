import express from 'express';
import passport from 'passport';
import {
    register, login,
    setup2FA, verify2FA, validate2FA, recover2FA, disable2FA,
    activateAccount, forgotPassword, resetPassword, resendActivation
} from '../controllers/authControllers.js';
import { generateToken } from '../utils/token.js';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';


const router = express.Router();

// AUTH LOCAL 
router.post('/register', register);
router.post('/login', login);
router.get('/activate', activateAccount); // GET para o link do email
router.post('/resend-activation', resendActivation); // POST para reenviar email
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);


// AUTH 2FA 
router.post('/2fa/setup', setup2FA);       // Gera o QR Code
router.post('/2fa/verify', verify2FA);     // Ativa o 2FA
router.post('/2fa/validate', validate2FA); // Valida no login
router.post('/2fa/recover', recover2FA);   // Enviar email
router.post('/2fa/disable', disable2FA);   // Confirmar via token


// AUTH GOOGLE
// Inicia a autenticação: http://localhost:3001/api/auth/google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Callback do Google: http://localhost:3001/api/auth/google/callback
router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    (req, res) => {
        // Redirecionamento dinâmico
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const nameEncoded = encodeURIComponent(req.user.nome_completo || req.user.nome || '');

        // Se tem 2FA ativado
        if (req.user.two_fa_enabled === 1 || req.user.two_fa_enabled === true) {
            // Manda para o login a pedir o código, sem enviar o token de sessão ainda
            return res.redirect(`${frontendUrl}/login?requires2FA=true&email=${req.user.email}&name=${nameEncoded}`);
        }

        // Login normal (sem 2FA)
        // Encode URI components para lidar com espaços/símbolos especiais no nome

        // Gerar token real
        const userObj = {
            id: req.user.id,
            nome_completo: req.user.nome_completo || req.user.nome,
            email: req.user.email,
            tipo_utilizador: req.user.tipo_utilizador
        };
        const token = generateToken(userObj);

        res.redirect(`${frontendUrl}/login?token=${token}&user=${req.user.email}&name=${nameEncoded}&id=${req.user.id}&role=${req.user.tipo_utilizador}`);
    }
);

// AUTH FACEBOOK
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get('/facebook/callback',
    passport.authenticate('facebook', { session: false, failureRedirect: '/login' }),
    (req, res) => {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const nameEncoded = encodeURIComponent(req.user.nome_completo || req.user.nome || '');

        if (req.user.two_fa_enabled === 1 || req.user.two_fa_enabled === true) {
            return res.redirect(`${frontendUrl}/login?requires2FA=true&email=${req.user.email}&name=${nameEncoded}`);
        }

        const userObj = {
            id: req.user.id,
            nome_completo: req.user.nome_completo || req.user.nome,
            email: req.user.email,
            tipo_utilizador: req.user.tipo_utilizador
        };
        const token = generateToken(userObj);

        res.redirect(`${frontendUrl}/login?token=${token}&user=${req.user.email}&name=${nameEncoded}&id=${req.user.id}&role=${req.user.tipo_utilizador}`);
    }
);

export default router;



