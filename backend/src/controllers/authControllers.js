import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/db.js';

export const register = async (req, res) => {
  try {
    const { nome_completo, email, password, tipo_utilizador } = req.body;

    // Validações básicas
    if (!nome_completo || !email || !password || !tipo_utilizador) {
      return res.status(400).json({ message: 'Dados em falta' });
    }

    // Verificar se o email já existe
    const [existingUser] = await db.query(
      'SELECT id FROM utilizadores WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({ message: 'Email já registado' });
    }

    // Encriptar password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Gerar token de ativação
    const activation_token = uuidv4();

    // Inserir utilizador
    await db.query(
      `INSERT INTO utilizadores 
      (nome_completo, email, password_hash, tipo_utilizador, activation_token, is_active, auth_provider, two_fa_enabled)
      VALUES (?, ?, ?, ?, ?, false, 'local', false)`,
      [nome_completo, email, password_hash, tipo_utilizador, activation_token]
    );

    return res.status(201).json({
      message: 'Utilizador registado com sucesso. Verifica o email para ativar a conta.',
      activation_token // ⚠️ só para testes (depois removemos)
    });
} catch (error) {
    console.log("--- ERRO DETETADO ---");
    console.error(error.message); // Isto vai imprimir a causa real no terminal
    console.log("----------------------");
    return res.status(500).json({ message: 'Erro no servidor', error: error.message });
}
};
