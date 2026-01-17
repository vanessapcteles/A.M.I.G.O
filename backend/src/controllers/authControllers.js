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
    return res.send('<h1>Conta activada com sucesso! Já pode fazer login.</h1><a href="http://localhost:5173/login">Ir para o Login</a>');
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao ativar conta' });
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
      return res.status(200).json({ message: '2FA ativado com sucesso!' });
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


// Editar utilizador
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome_completo, email, tipo_utilizador } = req.body;

    const [existing] = await db.query('SELECT * FROM utilizadores WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Utilizador não encontrado' });

    let role_id = existing[0].role_id;
    if (tipo_utilizador) {
      const [roles] = await db.query('SELECT id FROM roles WHERE nome = ?', [tipo_utilizador.toUpperCase()]);
      if (roles.length > 0) role_id = roles[0].id;
    }

    await db.query(
      'UPDATE utilizadores SET nome_completo = ?, email = ?, role_id = ? WHERE id = ?',
      [nome_completo || existing[0].nome_completo, email || existing[0].email, role_id, id]
    );

    // Gestão de Perfis
    if (tipo_utilizador) {
      const role = tipo_utilizador.toUpperCase();
      try {
        // Limpar perfis antigos (Garantir que só existe numa tabela de perfil)
        await db.query('DELETE FROM formandos WHERE utilizador_id = ?', [id]);
        await db.query('DELETE FROM formadores WHERE utilizador_id = ?', [id]);
        await db.query('DELETE FROM secretaria WHERE utilizador_id = ?', [id]);

        // Criar novo perfil
        if (role === 'FORMANDO') {
          await db.query('INSERT IGNORE INTO formandos (utilizador_id) VALUES (?)', [id]);
        } else if (role === 'FORMADOR') {
          await db.query('INSERT IGNORE INTO formadores (utilizador_id) VALUES (?)', [id]);
        } else if (role === 'SECRETARIA' || role === 'ADMIN') {
          // Admin faz parte da secretaria
          await db.query('INSERT IGNORE INTO secretaria (utilizador_id, cargo) VALUES (?, ?)', [id, 'Técnico']);
        }
      } catch (profileError) {
        console.error('Erro ao gerir perfil:', profileError);
        // faz apenas o login, não falha o request
      }
    }

    // Limpar cache
    await redis.del('users:all');

    return res.status(200).json({ message: 'Utilizador atualizado com sucesso' });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao atualizar utilizador' });
  }
};

// Eliminar utilizador
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    // Limpar perfis associados
    await db.query('DELETE FROM formandos WHERE utilizador_id = ?', [id]);
    await db.query('DELETE FROM formadores WHERE utilizador_id = ?', [id]);
    await db.query('DELETE FROM secretaria WHERE utilizador_id = ?', [id]);
    await db.query('DELETE FROM ficheiros_anexos WHERE utilizador_id = ?', [id]);
    await db.query('DELETE FROM horarios_eventos WHERE utilizador_id = ?', [id]);

    // Eliminar o utilizador
    const [result] = await db.query('DELETE FROM utilizadores WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Utilizador não encontrado' });

    // Limpar cache
    await redis.del('users:all');

    return res.status(200).json({ message: 'Utilizador eliminado com sucesso' });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao eliminar utilizador' });
  }
};

// Listar todos os utilizadores (com a cache)
export const getUsers = async (req, res) => {
  try {
    //ler da Cache
    const cachedUsers = await redis.get('users:all');
    if (cachedUsers) {
      console.log('Dados vindos da Cache (Redis)');
      return res.status(200).json(JSON.parse(cachedUsers));
    }

    // Se não existir, vai à Base de Dados
    console.log('Dados vindos da Base de Dados (MySQL)');
    const [users] = await db.query(
      `SELECT u.id, u.nome_completo, u.email, u.is_active, r.nome as tipo_utilizador, u.data_criacao 
       FROM utilizadores u 
       JOIN roles r ON u.role_id = r.id`
    );

    // Guardar na Cache por 1 hora (3600 segundos)
    await redis.setEx('users:all', 3600, JSON.stringify(users));

    return res.status(200).json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao listar utilizadores' });
  }
};

// Obter um utilizador específico (também se pode fazer cache por ID)
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const [users] = await db.query(
      `SELECT u.id, u.nome_completo, u.email, u.is_active, r.nome as tipo_utilizador, u.data_criacao 
       FROM utilizadores u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ?`,
      [id]
    );

    if (users.length === 0) return res.status(404).json({ message: 'Utilizador não encontrado' });
    return res.status(200).json(users[0]);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao obter utilizador' });
  }
};




