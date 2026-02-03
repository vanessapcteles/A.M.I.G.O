import { db } from '../config/db.js';
import redis from '../config/redis.js';

// Obter Perfil de Formando
export const getFormandoProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const [profiles] = await db.query(
            `SELECT f.*, u.nome_completo, u.email, 
                    COALESCE(c.nome_curso, c_turma.nome_curso) as curso_atual, 
                    COALESCE(c.id, c_turma.id) as id_curso,
                    t.codigo_turma as turma_atual
             FROM formandos f 
             JOIN utilizadores u ON f.utilizador_id = u.id 
             LEFT JOIN inscricoes i ON i.id_formando = f.id
             LEFT JOIN cursos c ON i.id_curso = c.id
             LEFT JOIN turmas t ON i.id_turma = t.id
             LEFT JOIN cursos c_turma ON t.id_curso = c_turma.id
             WHERE u.id = ?
             ORDER BY i.id DESC
             LIMIT 1`,
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

// Atribuir Turma a Formando
export const assignTurma = async (req, res) => {
    try {
        const { userId } = req.params;
        const { turmaId } = req.body;

        if (!turmaId) return res.status(400).json({ message: 'ID da turma é obrigatório' });

        // 1. Obter ID do Formando
        const [formando] = await db.query('SELECT id FROM formandos WHERE utilizador_id = ?', [userId]);
        if (formando.length === 0) return res.status(404).json({ message: 'Formando não encontrado' });

        const idFormando = formando[0].id;

        // 2. Verificar se já existe inscrição nessa turma
        const [existing] = await db.query(
            'SELECT * FROM inscricoes WHERE id_formando = ? AND id_turma = ?',
            [idFormando, turmaId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Formando já está inscrito nesta turma' });
        }

        // 2.5 Obter o curso da turma para manter consistência
        const [turmaInfo] = await db.query('SELECT id_curso FROM turmas WHERE id = ?', [turmaId]);
        if (turmaInfo.length === 0) return res.status(404).json({ message: 'Turma não encontrada' });

        const idCurso = turmaInfo[0].id_curso;

        // 3. Criar inscrição
        await db.query(
            'INSERT INTO inscricoes (id_formando, id_turma, id_curso, data_inscricao, estado) VALUES (?, ?, ?, NOW(), "APROVADO")',
            [idFormando, turmaId, idCurso]
        );

        return res.json({ message: 'Turma atribuída com sucesso' });
    } catch (error) {
        console.error('Erro ao atribuir turma:', error);
        return res.status(500).json({ message: 'Erro ao atribuir turma' });
    }
};
