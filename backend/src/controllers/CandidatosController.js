import { db } from '../config/db.js';

export const submitCandidacy = async (req, res) => {
    try {
        const { curso_id, dados_candidatura, pdf_file_id } = req.body;
        const user_id = req.user.id;

        console.log('Submetendo candidatura:', { user_id, curso_id, pdf_file_id });

        if (!curso_id || !pdf_file_id) {
            return res.status(400).json({ message: 'Curso e PDF são obrigatórios.' });
        }

        // Check if already applied to this course
        const [existing] = await db.query(
            'SELECT id, estado FROM inscricoes WHERE user_id = ? AND id_curso = ?',
            [user_id, curso_id]
        );

        if (existing.length > 0) {
            const candidatura = existing[0];

            // Se estiver Rejeitada, permite re-submeter (Atualizar)
            if (candidatura.estado === 'REJEITADO') {
                await db.query(
                    `UPDATE inscricoes 
                     SET estado = 'PENDENTE', dados_candidatura = ?, pdf_file_id = ?, data_inscricao = NOW()
                     WHERE id = ?`,
                    [JSON.stringify(dados_candidatura), pdf_file_id, candidatura.id]
                );
                return res.status(200).json({ message: 'Candidatura atualizada com sucesso.' });
            }

            return res.status(400).json({ message: 'Já existe uma candidatura pendente ou aprovada para este curso.' });
        }

        await db.query(
            `INSERT INTO inscricoes 
            (user_id, id_curso, estado, dados_candidatura, pdf_file_id, data_inscricao) 
            VALUES (?, ?, 'PENDENTE', ?, ?, NOW())`,
            [user_id, curso_id, JSON.stringify(dados_candidatura), pdf_file_id]
        );

        res.status(201).json({ message: 'Candidatura submetida com sucesso.' });
    } catch (error) {
        console.error('Erro ao submeter candidatura:', error);
        res.status(500).json({ message: 'Erro ao processar candidatura.' });
    }
};

export const getMyCandidacy = async (req, res) => {
    try {
        const user_id = req.user.id;
        const [rows] = await db.query(
            `SELECT i.*, c.nome_curso 
             FROM inscricoes i 
             JOIN cursos c ON i.id_curso = c.id
             WHERE i.user_id = ? 
             ORDER BY i.data_inscricao DESC LIMIT 1`,
            [user_id]
        );

        if (rows.length === 0) {
            return res.json(null);
        }

        const candidacy = rows[0];
        // Parse dados if string
        if (typeof candidacy.dados_candidatura === 'string') {
            candidacy.dados_candidatura = JSON.parse(candidacy.dados_candidatura);
        }

        // Fetch Turma Dates (Active or Latest)
        // Correct Link: formandos -> inscricoes (with id_turma) -> turmas
        const [turmaRes] = await db.query(
            `SELECT t.data_inicio, t.data_fim 
             FROM turmas t 
             JOIN inscricoes i ON t.id = i.id_turma
             JOIN formandos f ON i.id_formando = f.id
             WHERE f.utilizador_id = ? AND t.id_curso = ?
             ORDER BY FIELD(t.estado, 'a decorrer', 'planeado', 'terminado'), t.data_inicio DESC 
             LIMIT 1`,
            [user_id, candidacy.id_curso]
        );

        if (turmaRes.length > 0) {
            candidacy.data_inicio = turmaRes[0].data_inicio;
            candidacy.data_fim = turmaRes[0].data_fim;
        }

        // --- Progress Calculation (Restored/Preserved but using new data if needed, currently disabled by user request for bar) ---
        // User asked to remove bar, so we just send dates.

        res.json(candidacy);
    } catch (error) {
        console.error('Erro ao buscar minha candidatura:', error);
        res.status(500).json({ message: 'Erro ao buscar candidatura.' });
    }
};

export const getCandidacies = async (req, res) => {
    try {
        // Fetch users who are candidates (role 'CANDIDATO' or just check inscricoes with status pending?)
        // The user wants a list of candidacies.
        // We join with utilizadores and cursos.
        const [candidacies] = await db.query(`
            SELECT 
                i.id, 
                i.estado, 
                i.data_inscricao as data_candidatura,
                i.dados_candidatura,
                u.nome_completo, 
                u.email, 
                c.nome_curso,
                f.id as file_id,
                f.nome_original
            FROM inscricoes i
            JOIN utilizadores u ON i.user_id = u.id
            JOIN cursos c ON i.id_curso = c.id
            LEFT JOIN ficheiros_anexos f ON i.pdf_file_id = f.id
            WHERE i.estado IN ('PENDENTE', 'APROVADO', 'REJEITADO')
            ORDER BY i.data_inscricao DESC
        `);

        // Parse JSON data if needed, though frontend might handle it or we pass it as string
        // Let's parse it for cleaner API response
        const formatted = candidacies.map(c => ({
            ...c,
            dados_candidatura: typeof c.dados_candidatura === 'string'
                ? JSON.parse(c.dados_candidatura)
                : c.dados_candidatura
        }));

        res.json(formatted);
    } catch (error) {
        console.error('Erro ao buscar candidaturas:', error);
        res.status(500).json({ message: 'Erro ao buscar candidaturas.' });
    }
};

export const approveCandidacy = async (req, res) => {
    const { id } = req.params;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Update status in inscricoes
        await connection.query(
            'UPDATE inscricoes SET estado = ? WHERE id = ?',
            ['APROVADO', id]
        );

        // 2. Get user info from the candidatura
        const [rows] = await connection.query('SELECT user_id, dados_candidatura FROM inscricoes WHERE id = ?', [id]);
        if (rows.length === 0) {
            throw new Error('Candidatura não encontrada.');
        }
        const { user_id, dados_candidatura } = rows[0];
        // dados_candidatura might be a string or object depending on driver/mysql version json handling
        const dados = typeof dados_candidatura === 'string' ? JSON.parse(dados_candidatura) : dados_candidatura;

        // 3. Promote user role to FORMANDO (Assuming ID 5 is Formando, need to check ROLES table or use subquery)
        // Check ROLES table: 1: CANDIDATO, 2: ADMIN, 3: SECRETARIA, 4: FORMADOR, 5: FORMANDO
        // Or safer: SELECT id FROM roles WHERE nome = 'FORMANDO'
        await connection.query(
            'UPDATE utilizadores SET role_id = (SELECT id FROM roles WHERE nome = "FORMANDO") WHERE id = ?',
            [user_id]
        );

        // 4. Create record in formandos table if not exists
        // Check if already exists
        const [formandoExists] = await connection.query('SELECT id FROM formandos WHERE utilizador_id = ?', [user_id]);

        let formandoId;
        if (formandoExists.length === 0) {
            const [resFormando] = await connection.query(
                'INSERT INTO formandos (utilizador_id, morada, telemovel, data_nascimento) VALUES (?, ?, ?, ?)',
                [user_id, dados.morada, dados.telemovel, dados.data_nascimento]
            );
            formandoId = resFormando.insertId;
        } else {
            formandoId = formandoExists[0].id;
        }

        // 5. Link inscricao to the new formando_id
        await connection.query(
            'UPDATE inscricoes SET id_formando = ? WHERE id = ?',
            [formandoId, id]
        );

        await connection.commit();
        res.json({ message: 'Candidatura aprovada e utilizador promovido a Formando.' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Erro ao aprovar candidatura.' });
    } finally {
        connection.release();
    }
};

export const rejectCandidacy = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE inscricoes SET estado = ? WHERE id = ?', ['REJEITADO', id]);
        res.json({ message: 'Candidatura rejeitada.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao rejeitar candidatura.' });
    }
};
