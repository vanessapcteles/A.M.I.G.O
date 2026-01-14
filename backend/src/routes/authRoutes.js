import express from 'express';
import passport from 'passport';
import {
    register, login, updateUser, deleteUser, getUsers, getUserById,
    setup2FA, verify2FA, validate2FA,
    activateAccount, forgotPassword, resetPassword
} from '../controllers/authControllers.js';


const router = express.Router();

// --- AUTH LOCAL ---
router.post('/register', register);
router.post('/login', login);
router.get('/activate', activateAccount); // GET para o link do email
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/user', getUsers);

router.get('/user/:id', getUserById);
router.put('/user/:id', updateUser);
router.delete('/user/:id', deleteUser);

// --- AUTH 2FA ---
router.post('/2fa/setup', setup2FA);       // Gera o QR Code
router.post('/2fa/verify', verify2FA);     // Ativa o 2FA
router.post('/2fa/validate', validate2FA); // Valida no login


// --- AUTH GOOGLE ---
// Inicia a autenticação: http://localhost:3001/api/auth/google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Callback do Google: http://localhost:3001/api/auth/google/callback
router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    (req, res) => {
        // Aqui podes gerar um JWT para o utilizador Google
        // Por agora, vamos apenas redirecionar para o frontend com uma mensagem
        res.redirect(`http://localhost:5173/login?token=token_google_success&user=${req.user.email}`);
    }
);

export default router;



