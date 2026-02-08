import { db } from '../config/db.js';

// Obter Perfil de Formador
export const getFormadorProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const [profiles] = await db.query(
            `SELECT f.*, u.nome_completo, u.email 
             FROM formadores f 
             JOIN utilizadores u ON f.utilizador_id = u.id 
             WHERE u.id = ?`,
            [userId]
        );

        if (profiles.length === 0) return res.status(404).json({ message: 'Perfil não encontrado' });
        return res.json(profiles[0]);
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao obter perfil' });
    }
};

// Atualizar Perfil de Formador
export const updateFormadorProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const { biografia } = req.body;

        await db.query(`INSERT IGNORE INTO formadores (utilizador_id) VALUES (?)`, [userId]);

        await db.query(
            `UPDATE formadores SET biografia = ? WHERE utilizador_id = ?`,
            [biografia, userId]
        );

        return res.json({ message: 'Perfil atualizado com sucesso' });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao atualizar perfil' });
    }
};

// Listar todos os formadores
export const listFormadores = async (req, res) => {
    try {
        // Self-repair: Garantir que todos com role FORMADOR têm perfil na tabela formadores
        await db.query(`
            INSERT INTO formadores (utilizador_id)
            SELECT u.id FROM utilizadores u
            JOIN roles r ON u.role_id = r.id
            WHERE r.nome = 'FORMADOR'
            AND u.id NOT IN (SELECT utilizador_id FROM formadores)
        `);

        const [formadores] = await db.query(`
            SELECT u.id, u.nome_completo, u.email, u.is_active, f.biografia, f.id as id_formador_perfil
            FROM utilizadores u
            JOIN roles r ON u.role_id = r.id
            JOIN formadores f ON u.id = f.utilizador_id
            WHERE r.nome = 'FORMADOR'
        `);
        return res.json(formadores);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao listar formadores' });
    }
};
// Obter histórico de lecionação
export const getFormadorHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const [history] = await db.query(`
            SELECT m.nome_modulo, c.nome_curso, t.codigo_turma, t.data_inicio, t.data_fim, td.id_turma, td.id_modulo
            FROM turma_detalhes td
            JOIN modulos m ON td.id_modulo = m.id
            JOIN turmas t ON td.id_turma = t.id
            JOIN cursos c ON t.id_curso = c.id
            JOIN formadores f ON td.id_formador = f.id
            WHERE f.utilizador_id = ?
        `, [userId]);

        return res.json(history);
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao obter histórico do formador' });
    }
};
