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
        const { courseId, search } = req.query;

        let query = `
            SELECT u.id, u.nome_completo, u.email, u.is_active, f.telemovel, f.morada,
            curr_course.nome_curso as curso_atual,
            curr_course.id_curso as id_curso
            FROM utilizadores u
            JOIN roles r ON u.role_id = r.id
            LEFT JOIN formandos f ON u.id = f.utilizador_id
            -- Join with latest enrollment to get current course
            LEFT JOIN (
                SELECT i.id_formando, c.nome_curso, c.id as id_curso
                FROM inscricoes i 
                JOIN cursos c ON i.id_curso = c.id
                WHERE i.id IN (
                    SELECT MAX(id) FROM inscricoes GROUP BY id_formando
                )
            ) as curr_course ON curr_course.id_formando = f.id
            WHERE r.nome = 'FORMANDO'
        `;

        const params = [];

        if (courseId) {
            query += ' AND curr_course.id_curso = ?';
            params.push(courseId);
        }

        if (search) {
            query += ' AND (u.nome_completo LIKE ? OR u.email LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        const [formandos] = await db.query(query, params);
        return res.json(formandos);
    } catch (error) {
        console.error('Erro ao listar formandos:', error);
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

// Obter Notas Detalhadas (Por Módulo)
export const getFormandoGrades = async (req, res) => {
    try {
        const { userId } = req.params;

        // Procura inscrição ativa (ou a última)
        const [inscricao] = await db.query(`
            SELECT i.id, c.nome_curso, t.codigo_turma 
            FROM inscricoes i
            JOIN formandos f ON i.id_formando = f.id
            JOIN turmas t ON i.id_turma = t.id
            JOIN cursos c ON t.id_curso = c.id
            WHERE f.utilizador_id = ? 
            ORDER BY i.data_inscricao DESC 
            LIMIT 1
        `, [userId]);

        if (inscricao.length === 0) {
            return res.json({ message: 'Sem inscrições ativas', grades: [] });
        }

        const inscricaoId = inscricao[0].id;

        // Procura módulos do curso e notas correspondentes
        const [grades] = await db.query(`
            SELECT 
                m.id as modulo_id, 
                m.nome_modulo, 
                m.carga_horaria,
                a.nota, 
                a.data_avaliacao, 
                a.observacoes
            FROM inscricoes i
            JOIN turmas t ON i.id_turma = t.id
            JOIN curso_modulos cm ON t.id_curso = cm.id_curso
            JOIN modulos m ON cm.id_modulo = m.id
            LEFT JOIN avaliacoes a ON (a.id_inscricao = i.id AND a.id_modulo = m.id)
            WHERE i.id = ?
            ORDER BY cm.sequencia ASC
        `, [inscricaoId]);

        return res.json({
            curso: inscricao[0].nome_curso,
            turma: inscricao[0].codigo_turma,
            grades: grades
        });

    } catch (error) {
        console.error('Erro ao obter notas:', error);
        return res.status(500).json({ message: 'Erro ao obter notas detalhadas' });
    }
};

// Atribuir Turma a Formando
export const assignTurma = async (req, res) => {
    try {
        const { userId } = req.params;
        const { turmaId } = req.body;

        if (!turmaId) return res.status(400).json({ message: 'ID da turma é obrigatório' });

        // Obter ID do Formando
        const [formando] = await db.query('SELECT id FROM formandos WHERE utilizador_id = ?', [userId]);
        if (formando.length === 0) return res.status(404).json({ message: 'Formando não encontrado' });

        const idFormando = formando[0].id;

        // Verifica se já existe inscrição nessa turma
        const [existing] = await db.query(
            'SELECT * FROM inscricoes WHERE id_formando = ? AND id_turma = ?',
            [idFormando, turmaId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Formando já está inscrito nesta turma' });
        }

        // Obter o curso da turma para manter consistência
        const [turmaInfo] = await db.query('SELECT id_curso FROM turmas WHERE id = ?', [turmaId]);
        if (turmaInfo.length === 0) return res.status(404).json({ message: 'Turma não encontrada' });

        const idCurso = turmaInfo[0].id_curso;

        // Cria inscrição
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
