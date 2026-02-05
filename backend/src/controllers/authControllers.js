import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { db } from '../config/db.js';
import redis from '../config/redis.js';
import { sendActivationEmail, sendPasswordResetEmail } from '../config/mailer.js';
import { generateToken } from '../utils/token.js';

export const register = async (req, res) => {
  try {
    const { nome_completo, email, password, tipo_utilizador } = req.body;

    // Validar dados
    if (!nome_completo || !email || !password || !tipo_utilizador) {
      return res.status(400).json({ message: 'Dados em falta' });
    }

    const [roles] = await db.query('SELECT id FROM roles WHERE nome = ?', [tipo_utilizador.toUpperCase()]);
    if (roles.length === 0) return res.status(400).json({ message: 'Tipo de utilizador inválido' });
    const role_id = roles[0].id;

    const [existingUser] = await db.query('SELECT id FROM utilizadores WHERE email = ?', [email]);
    if (existingUser.length > 0) return res.status(409).json({ message: 'Email já registado' });

    const password_hash = await bcrypt.hash(password, 10);
    const activation_token = uuidv4();

    await db.query(
      `INSERT INTO utilizadores (nome_completo, email, password_hash, role_id, activation_token, is_active, auth_provider)
      VALUES (?, ?, ?, ?, ?, false, 'local')`,
      [nome_completo, email, password_hash, role_id, activation_token]
    );

    // Enviar email de ativação
    try {
      await sendActivationEmail(email, activation_token);
    } catch (mailError) {
      console.error('Erro ao enviar email:', mailError.message);
    }

    // Limpar cache depois de inserir novo utilizador
    await redis.del('users:all');

    return res.status(201).json({ message: 'Utilizador registado com sucesso. Verifica o teu email para ativar a conta.' });
  } catch (error) {
    return res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
};

// Ativar conta
export const activateAccount = async (req, res) => {
  try {
    const { token } = req.query;

    const [users] = await db.query('SELECT id FROM utilizadores WHERE activation_token = ?', [token]);

    if (users.length === 0) {
      return res.status(400).send('<h1>Token inválido ou expirado.</h1>');
    }

    await db.query('UPDATE utilizadores SET is_active = true, activation_token = NULL WHERE activation_token = ?', [token]);

    // Mandar para o login ou mostrar mensagem
    return res.send(`
      <head>
        <title>Conta Ativada - Academy Manager</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          body { 
            background: radial-gradient(circle at 50% 50%, #1e293b 0%, #020617 100%);
            color: white; 
            font-family: 'Inter', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            text-align: center;
          }
          .card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            padding: 3.5rem;
            border-radius: 24px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            max-width: 450px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
          .icon {
            width: 72px;
            height: 72px;
            background: rgba(59, 130, 246, 0.1);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
            color: #3b82f6;
            font-size: 32px;
          }
          h1 { color: white; margin-bottom: 1rem; font-weight: 700; }
          p { color: #94a3b8; margin-bottom: 2.5rem; line-height: 1.6; }
          a {
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            color: white;
            padding: 1rem 2.5rem;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 600;
            display: inline-block;
            transition: transform 0.2s;
          }
          a:hover { transform: translateY(-2px); }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✓</div>
          <h1>Sucesso!</h1>
          <p>A sua conta foi ativada com sucesso. Já pode aceder à plataforma e começar a gerir a sua academia.</p>
          <a href="http://localhost:5173/login">Ir para o Login</a>
        </div>
      </body>
    `);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao ativar conta' });
  }
};

// Reenviar email de ativação
export const resendActivation = async (req, res) => {
  try {
    const { email } = req.body;

    // Verificar se user existe
    const [users] = await db.query('SELECT id, is_active, activation_token FROM utilizadores WHERE email = ?', [email]);

    if (users.length === 0) {
      // Segurança: não revelar se email existe ou não
      return res.status(200).json({ message: 'Se a conta existir e não estiver ativa, um novo email foi enviado.' });
    }

    const user = users[0];

    if (user.is_active) {
      return res.status(400).json({ message: 'Esta conta já se encontra ativa. Podes fazer login.' });
    }

    let token = user.activation_token;
    if (!token) {
      token = uuidv4();
      await db.query('UPDATE utilizadores SET activation_token = ? WHERE id = ?', [token, user.id]);
    }

    await sendActivationEmail(email, token);

    return res.status(200).json({ message: 'Email de ativação reenviado com sucesso!' });
  } catch (error) {
    console.error('Erro ao reenviar ativação:', error);
    return res.status(500).json({ message: 'Erro ao processar o pedido' });
  }
};

// Pedir recuperação de password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const [users] = await db.query('SELECT id FROM utilizadores WHERE email = ?', [email]);

    if (users.length > 0) {
      const resetToken = uuidv4();
      await db.query('UPDATE utilizadores SET reset_password_token = ? WHERE email = ?', [resetToken, email]);
      await sendPasswordResetEmail(email, resetToken);
    }

    //Resposta dada independentemente se o email existe ou não (segurança)
    return res.status(200).json({ message: 'Se o email existir, enviámos instruções para a recuperação.' });
  } catch (error) {
    return res.status(500).json({ message: 'Erro no servidor' });
  }
};

// reset da password
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const [users] = await db.query('SELECT id FROM utilizadores WHERE reset_password_token = ?', [token]);

    if (users.length === 0) {
      return res.status(400).json({ message: 'Token inválido ou expirado.' });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);

    await db.query(
      'UPDATE utilizadores SET password_hash = ?, reset_password_token = NULL WHERE reset_password_token = ?',
      [password_hash, token]
    );

    return res.status(200).json({ message: 'Password atualizada com sucesso!' });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao repor password' });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Dados em falta' });
    }

    // Join com a tabela roles para ter o nome da role
    const [users] = await db.query(
      `SELECT u.*, r.nome as tipo_utilizador 
       FROM utilizadores u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.email = ?`,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const user = users[0];

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: 'Conta ainda não ativada. Verifica o teu email.' });
    }

    // User Object para Token e Resposta
    const userObj = {
      id: user.id,
      nome_completo: user.nome_completo,
      email: user.email,
      tipo_utilizador: user.tipo_utilizador
    };

    const token = user.two_fa_enabled === 1 ? null : generateToken(userObj);

    return res.status(200).json({
      success: true,
      requires2FA: user.two_fa_enabled === 1,
      user: user.two_fa_enabled === 1 ? null : userObj,
      token: token
    });

  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ message: 'Erro no servidor' });
  }
};

// Gerar QR Code (apenas funciona com o autenticador google ler o QR Code)
export const setup2FA = async (req, res) => {
  try {
    const { userId } = req.body;

    const secret = speakeasy.generateSecret({
      name: `AcademyManager (ID: ${userId})`
    });

    // Guardar temporariamente 
    await db.query(
      'UPDATE utilizadores SET two_fa_secret = ? WHERE id = ?',
      [secret.base32, userId]
    );

    // imagem do QR Code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    return res.status(200).json({
      qrCode: qrCodeUrl,
      secret: secret.base32 //caso não consiga ler o QR
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao configurar 2FA' });
  }
};

// Verificar primeiro e ativar definitivamente
export const verify2FA = async (req, res) => {
  try {
    const { userId, token } = req.body;

    const [users] = await db.query('SELECT two_fa_secret FROM utilizadores WHERE id = ?', [userId]);
    if (users.length === 0) return res.status(404).json({ message: 'User não encontrado' });

    const verified = speakeasy.totp.verify({
      secret: users[0].two_fa_secret,
      encoding: 'base32',
      token
    });

    if (verified) {
      await db.query('UPDATE utilizadores SET two_fa_enabled = true WHERE id = ?', [userId]);

      // Obter utilizador atualizado para sincronizar frontend
      const [updatedUsers] = await db.query(
        `SELECT u.id, u.nome_completo, u.email, r.nome as tipo_utilizador, u.two_fa_enabled 
         FROM utilizadores u 
         JOIN roles r ON u.role_id = r.id 
         WHERE u.id = ?`,
        [userId]
      );

      return res.status(200).json({
        message: '2FA ativado com sucesso!',
        user: updatedUsers[0]
      });
    } else {
      return res.status(400).json({ message: 'Código inválido. Tenta novamente.' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao verificar 2FA' });
  }
};

// Validar 2FA durante o Login
export const validate2FA = async (req, res) => {
  try {
    const { email, token } = req.body;

    const [users] = await db.query(
      `SELECT u.*, r.nome as tipo_utilizador 
       FROM utilizadores u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.email = ?`,
      [email]
    );

    if (users.length === 0) return res.status(404).json({ message: 'User não encontrado' });
    const user = users[0];

    const verified = speakeasy.totp.verify({
      secret: user.two_fa_secret,
      encoding: 'base32',
      token
    });

    if (verified) {
      const userObj = {
        id: user.id,
        nome_completo: user.nome_completo,
        email: user.email,
        tipo_utilizador: user.tipo_utilizador
      };

      const jwtToken = generateToken(userObj);

      return res.status(200).json({
        success: true,
        user: userObj,
        token: jwtToken
      });
    } else {
      return res.status(401).json({ message: 'Código 2FA incorreto' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao validar 2FA' });
  }
};

// Recuperar 2FA (Enviar email para desativar)
export const recover2FA = async (req, res) => {
  try {
    const { email } = req.body;
    const [users] = await db.query('SELECT id, two_fa_enabled FROM utilizadores WHERE email = ?', [email]);

    if (users.length > 0 && users[0].two_fa_enabled) {
      const token = uuidv4();
      // Reutilizamos reset_password_token para evitar alterar schema DB 
      await db.query('UPDATE utilizadores SET reset_password_token = ? WHERE email = ?', [token, email]);

      // Importar a nova função se não estiver
      const { send2FADisableEmail } = await import('../config/mailer.js');
      await send2FADisableEmail(email, token);
    }

    return res.status(200).json({ message: 'Se o email existir e tiver 2FA ativo, enviámos instruções.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao processar pedido' });
  }
};

// Desativar 2FA via Token
export const disable2FA = async (req, res) => {
  try {
    const { token } = req.body;

    const [users] = await db.query('SELECT id FROM utilizadores WHERE reset_password_token = ?', [token]);
    if (users.length === 0) return res.status(400).json({ message: 'Token inválido ou expirado.' });

    await db.query(
      'UPDATE utilizadores SET two_fa_enabled = false, two_fa_secret = NULL, reset_password_token = NULL WHERE reset_password_token = ?',
      [token]
    );

    return res.status(200).json({ message: '2FA desativado com sucesso. Pode entrar sem código.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao desativar 2FA' });
  }
};







