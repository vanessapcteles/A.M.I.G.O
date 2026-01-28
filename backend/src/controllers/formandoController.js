import { db } from '../config/db.js';
import redis from '../config/redis.js';

// Obter Perfil de Formando
export const getFormandoProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const [profiles] = await db.query(
            `SELECT f.*, u.nome_completo, u.email, c.nome_curso as curso_atual
             FROM formandos f 
             JOIN utilizadores u ON f.utilizador_id = u.id 
             LEFT JOIN inscricoes i ON i.id_formando = f.id AND i.estado = 'APROVADO'
             LEFT JOIN cursos c ON i.id_curso = c.id
             WHERE u.id = ?`,
            [userId]
        );

        if (profiles.length === 0) return res.status(404).json({ message: 'Perfil não encontrado' });
        return res.json(profiles[0]);
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao obter perfil' });
    }
};

// Atualizar Perfil de Formando
export const updateFormandoProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const { data_nascimento, morada, telemovel } = req.body;

        // Verifica se existe perfil, senão cria
        await db.query(`INSERT IGNORE INTO formandos (utilizador_id) VALUES (?)`, [userId]);

        await db.query(
            `UPDATE formandos 
             SET data_nascimento = ?, morada = ?, telemovel = ? 
             WHERE utilizador_id = ?`,
            [data_nascimento, morada, telemovel, userId]
        );

        return res.json({ message: 'Perfil atualizado com sucesso' });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao atualizar perfil' });
    }
};

// Listar todos os formandos (para a tabela)
export const listFormandos = async (req, res) => {
    try {
        const [formandos] = await db.query(`
            SELECT u.id, u.nome_completo, u.email, u.is_active, f.telemovel, f.morada 
            FROM utilizadores u
            JOIN roles r ON u.role_id = r.id
            LEFT JOIN formandos f ON u.id = f.utilizador_id
            WHERE r.nome = 'FORMANDO'
        `);
        return res.json(formandos);
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao listar formandos' });
    }
};
// Obter histórico académico (Cursos e notas)
export const getFormandoAcademicRecord = async (req, res) => {
    try {
        const { userId } = req.params;
        const [records] = await db.query(`
            SELECT c.nome_curso, i.nota_final, t.codigo_turma, t.data_inicio, t.data_fim
            FROM inscricoes i
            JOIN turmas t ON i.id_turma = t.id
            JOIN cursos c ON t.id_curso = c.id
            JOIN formandos f ON i.id_formando = f.id
            WHERE f.utilizador_id = ?
        `, [userId]);

        return res.json(records);
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao obter registo académico' });
    }
};
