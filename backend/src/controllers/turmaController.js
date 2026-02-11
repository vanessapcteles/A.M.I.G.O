import { db } from '../config/db.js';

// Listar todas as turmas (com join para o curso)
// Listar todas as turmas com paginação
export const getTurmas = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, courseId } = req.query;
        const offset = (page - 1) * limit;

        // --- Automated Status Update ---
        // 1. Planeado -> A Decorrer: if start date reached and still running
        await db.query(`
            UPDATE turmas 
            SET estado = 'a decorrer' 
            WHERE estado = 'planeado' 
            AND DATE(data_inicio) <= CURDATE() 
            AND DATE(data_fim) >= CURDATE()
        `);

        // 2. Mark as Terminado: if end date passed
        await db.query(`
            UPDATE turmas 
            SET estado = 'terminado' 
            WHERE estado != 'terminado' 
            AND DATE(data_fim) < CURDATE()
        `);
        // -------------------------------

        let query = `
            SELECT t.*, c.nome_curso 
            FROM turmas t 
            JOIN cursos c ON t.id_curso = c.id 
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            query += ' AND (t.codigo_turma LIKE ? OR c.nome_curso LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (req.user && req.user.role === 'FORMADOR') {
            query += `
                AND t.id IN (
                    SELECT td.id_turma 
                    FROM turma_detalhes td 
                    JOIN formadores f ON td.id_formador = f.id 
                    WHERE f.utilizador_id = ?
                )
            `;
            params.push(req.user.id);
        }

        if (courseId) {
            query += ' AND t.id_curso = ?';
            params.push(courseId);
        }

        query += ' ORDER BY t.data_inicio DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [turmas] = await db.query(query, params);

        // Count for pagination
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM turmas t 
            JOIN cursos c ON t.id_curso = c.id
            WHERE 1=1
        `;
        const countParams = [];

        if (search) {
            countQuery += ' AND (t.codigo_turma LIKE ? OR c.nome_curso LIKE ?)';
            countParams.push(`%${search}%`, `%${search}%`);
        }

        if (courseId) {
            countQuery += ' AND t.id_curso = ?';
            countParams.push(courseId);
        }

        if (req.user && req.user.role === 'FORMADOR') {
            countQuery += `
                AND t.id IN (
                    SELECT td.id_turma 
                    FROM turma_detalhes td 
                    JOIN formadores f ON td.id_formador = f.id 
                    WHERE f.utilizador_id = ?
                )
            `;
            countParams.push(req.user.id);
        }

        const [totalCount] = await db.query(countQuery, countParams);

        return res.status(200).json({
            data: turmas,
            total: totalCount[0].total,
            pages: Math.ceil(totalCount[0].total / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        console.error('Erro ao listar turmas:', error);
        return res.status(500).json({ message: 'Erro ao listar turmas' });
    }
};

// Listar cursos para o formulário de criação
export const getCursosParaTurma = async (req, res) => {
    try {
        const [cursos] = await db.query('SELECT id, nome_curso FROM cursos WHERE estado != "terminado"');
        return res.status(200).json(cursos);
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao listar cursos' });
    }
};

// Criar nova turma
export const createTurma = async (req, res) => {
    try {
        const { id_curso, codigo_turma, data_inicio, data_fim, estado } = req.body;

        if (!id_curso || !codigo_turma || !data_inicio || !data_fim) {
            return res.status(400).json({ message: 'Todos os campos obrigatórios devem ser preenchidos' });
        }

        const [result] = await db.query(
            'INSERT INTO turmas (id_curso, codigo_turma, data_inicio, data_fim, estado) VALUES (?, ?, ?, ?, ?)',
            [id_curso, codigo_turma, data_inicio, data_fim, estado || 'planeado']
        );

        const turmaId = result.insertId;

        // Auto-inherit modules from Course Curriculum
        // Fetch course modules
        const [courseModules] = await db.query('SELECT * FROM curso_modulos WHERE id_curso = ?', [id_curso]);

        if (courseModules.length > 0) {
            for (const cm of courseModules) {
                // Get default hours from module if horas_padrao is null
                let horas = cm.horas_padrao;
                if (!horas) {
                    const [mod] = await db.query('SELECT carga_horaria FROM modulos WHERE id = ?', [cm.id_modulo]);
                    horas = mod[0]?.carga_horaria || 0;
                }

                // Insert into turma_detalhes
                // NOTE: id_formador and id_sala MUST be nullable in DB for this to work.
                await db.query(`
                    INSERT INTO turma_detalhes (id_turma, id_modulo, id_formador, id_sala, horas_planeadas, sequencia)
                    VALUES (?, ?, NULL, NULL, ?, ?)
                `, [turmaId, cm.id_modulo, horas, cm.sequencia]);
            }
        }

        return res.status(201).json({
            id: turmaId,
            message: 'Turma criada com sucesso!'
        });
    } catch (error) {
        console.error('Erro ao criar turma:', error);
        return res.status(500).json({ message: 'Erro ao criar turma na base de dados' });
    }
};

// Atualizar turma
export const updateTurma = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_curso, codigo_turma, data_inicio, data_fim, estado } = req.body;

        const [result] = await db.query(
            'UPDATE turmas SET id_curso = ?, codigo_turma = ?, data_inicio = ?, data_fim = ?, estado = ? WHERE id = ?',
            [id_curso, codigo_turma, data_inicio, data_fim, estado, id]
        );

        if (result.affectedRows === 0) return res.status(404).json({ message: 'Turma não encontrada' });

        return res.status(200).json({ message: 'Turma atualizada com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar turma:', error);
        return res.status(500).json({ message: 'Erro ao atualizar turma' });
    }
};

// Eliminar turma
export const deleteTurma = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar se existem alunos ou horários associados (opcional, mas recomendado)
        // Por agora vamos permitir eliminar se não houver restrições de FK
        await db.query('DELETE FROM turmas WHERE id = ?', [id]);
        return res.status(200).json({ message: 'Turma eliminada com sucesso' });
    } catch (error) {
        console.error('Erro ao eliminar turma:', error);
        return res.status(500).json({ message: 'Erro ao eliminar turma' });
    }
};
// Obter turma por ID (com detalhes do curso)
export const getTurmaById = async (req, res) => {
    try {
        const { id } = req.params;
        const [turmas] = await db.query(`
            SELECT t.*, c.nome_curso 
            FROM turmas t 
            JOIN cursos c ON t.id_curso = c.id 
            WHERE t.id = ?
        `, [id]);

        if (turmas.length === 0) return res.status(404).json({ message: 'Turma não encontrada' });

        return res.status(200).json(turmas[0]);
    } catch (error) {
        console.error('Erro ao obter turma:', error);
        return res.status(500).json({ message: 'Erro ao obter turma' });
    }
};

// Importar currículo do curso para a turma
export const importCurriculum = async (req, res) => {
    try {
        const { id } = req.params; // Turma ID

        // 1. Obter o id_curso da turma
        const [turmas] = await db.query('SELECT id_curso FROM turmas WHERE id = ?', [id]);
        if (turmas.length === 0) return res.status(404).json({ message: 'Turma não encontrada' });

        const id_curso = turmas[0].id_curso;

        // 2. Obter os módulos do curso
        const [courseModules] = await db.query('SELECT * FROM curso_modulos WHERE id_curso = ?', [id_curso]);

        if (courseModules.length === 0) {
            return res.status(400).json({ message: 'Este curso não tem módulos definidos no currículo.' });
        }

        // 2.5 Obter sequências já usadas na turma
        const [existingDetails] = await db.query('SELECT sequencia FROM turma_detalhes WHERE id_turma = ?', [id]);
        const usedSequences = new Set(existingDetails.map(d => d.sequencia));

        let maxSeq = 0;
        if (usedSequences.size > 0) {
            maxSeq = Math.max(...Array.from(usedSequences));
        }

        let addedCount = 0;

        // 3. Inserir na turma (verificar duplicados)
        for (const cm of courseModules) {
            // Verificar se já existe na turma
            const [exists] = await db.query(
                'SELECT id FROM turma_detalhes WHERE id_turma = ? AND id_modulo = ?',
                [id, cm.id_modulo]
            );

            if (exists.length === 0) {
                // Obter carga horária padrão se não definida no curso_modulos
                let horas = cm.horas_padrao;
                if (!horas) {
                    const [mod] = await db.query('SELECT carga_horaria FROM modulos WHERE id = ?', [cm.id_modulo]);
                    horas = mod[0]?.carga_horaria || 0;
                }

                // Determinar sequência segura
                let targetSeq = cm.sequencia;
                if (usedSequences.has(targetSeq)) {
                    // Conflito de sequência: adicionar ao final
                    maxSeq++;
                    targetSeq = maxSeq;
                }

                // Adicionar a nova sequência ao conjunto para evitar conflitos dentro do próprio loop de importação
                // (embora curso_modulos devesse ter sequências únicas, é uma boa defesa)
                usedSequences.add(targetSeq);
                if (targetSeq > maxSeq) maxSeq = targetSeq;

                await db.query(`
                    INSERT INTO turma_detalhes (id_turma, id_modulo, id_formador, id_sala, horas_planeadas, sequencia)
                    VALUES (?, ?, NULL, NULL, ?, ?)
                `, [id, cm.id_modulo, horas, targetSeq]);
                addedCount++;
            }
        }

        return res.status(200).json({
            message: `Importação concluída. ${addedCount} novos módulos adicionados.`,
            added: addedCount
        });

    } catch (error) {
        console.error('Erro ao importar currículo:', error);
        return res.status(500).json({ message: 'Erro ao importar currículo: ' + error.message });
    }
};
