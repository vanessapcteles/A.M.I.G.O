import { db } from '../config/db.js';

// Listar todos os modulos
// Listar todos os modulos com paginação
// Listar todos os modulos com paginação
export const getModules = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, courseId, area } = req.query;
        const offset = (page - 1) * limit;

        // Base query
        let query = 'SELECT DISTINCT m.* FROM modulos m';
        const params = [];

        // Join if filtering by course
        if (courseId) {
            query += ' JOIN curso_modulos cm ON m.id = cm.id_modulo';
        }

        let whereClauses = [];

        if (courseId) {
            whereClauses.push('cm.id_curso = ?');
            params.push(courseId);
        }

        if (area) {
            whereClauses.push('m.area = ?'); // Filter by explicit module area
            params.push(area);
        }

        if (search) {
            whereClauses.push('m.nome_modulo LIKE ?');
            params.push(`%${search}%`);
        }

        if (whereClauses.length > 0) {
            query += ' WHERE ' + whereClauses.join(' AND ');
        }

        query += ' ORDER BY m.nome_modulo ASC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [modules] = await db.query(query, params);

        // Count for pagination
        let countQuery = 'SELECT COUNT(DISTINCT m.id) as total FROM modulos m';

        if (courseId) {
            countQuery += ' JOIN curso_modulos cm ON m.id = cm.id_modulo';
        }

        // Reuse calculated where clauses, but reconstruct params for count
        const countWhereParams = [];
        if (courseId) countWhereParams.push(courseId);
        if (area) countWhereParams.push(area);
        if (search) countWhereParams.push(`%${search}%`);

        if (whereClauses.length > 0) {
            countQuery += ' WHERE ' + whereClauses.join(' AND ');
        }

        const [totalCount] = await db.query(countQuery, countWhereParams);

        return res.status(200).json({
            data: modules,
            total: totalCount[0].total,
            pages: Math.ceil(totalCount[0].total / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        console.error('Erro ao listar modulos:', error);
        return res.status(500).json({ message: 'Erro ao listar modulos' });
    }
};

// Criar novo modulo
export const createModule = async (req, res) => {
    try {
        const { nome_modulo, carga_horaria, courseId, area } = req.body;

        if (!nome_modulo || !carga_horaria) {
            return res.status(400).json({ message: 'Nome do módulo e carga horária são obrigatórios' });
        }

        const [result] = await db.query(
            'INSERT INTO modulos (nome_modulo, carga_horaria, area) VALUES (?, ?, ?)',
            [nome_modulo, carga_horaria, area]
        );
        const newModuleId = result.insertId;

        // Se veio courseId, associar de imediato
        if (courseId) {
            // Verificar se o curso existe (opcional, mas bom pra evitar FK error cru)
            // Aqui vamos direto no try/catch da FK

            await db.query(
                'INSERT INTO curso_modulos (id_curso, id_modulo, sequencia, horas_padrao) VALUES (?, ?, ?, ?)',
                [courseId, newModuleId, 0, carga_horaria] // default sequencia 0, horas_padrao = carga_horaria
            );
        }

        return res.status(201).json({
            id: newModuleId,
            message: 'Módulo criado com sucesso!'
        });
    } catch (error) {
        console.error('Erro ao criar modulo:', error);
        return res.status(500).json({ message: 'Erro ao criar modulo' });
    }
};

// Atualizar modulo
export const updateModule = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome_modulo, carga_horaria } = req.body;

        const [result] = await db.query(
            'UPDATE modulos SET nome_modulo = ?, carga_horaria = ? WHERE id = ?',
            [nome_modulo, carga_horaria, id]
        );

        if (result.affectedRows === 0) return res.status(404).json({ message: 'Módulo não encontrado' });

        return res.status(200).json({ message: 'Módulo atualizado com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar modulo:', error);
        return res.status(500).json({ message: 'Erro ao atualizar modulo' });
    }
};

// Eliminar modulo
export const deleteModule = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar dependências (opcional, mas recomendado se existirem tabelas ligadas como turma_detalhes)
        // Por agora, assumimos que a constraint da BD vai bloquear se houver dependências (RESTRICT)
        try {
            await db.query('DELETE FROM modulos WHERE id = ?', [id]);
        } catch (dbError) {
            if (dbError.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(400).json({ message: 'Não é possível eliminar este módulo porque está a ser utilizado em turmas/cursos.' });
            }
            throw dbError;
        }

        return res.status(200).json({ message: 'Módulo eliminado com sucesso' });
    } catch (error) {
        console.error('Erro ao eliminar modulo:', error);
        return res.status(500).json({ message: 'Erro ao eliminar modulo' });
    }
};
// Obter lista de áreas únicas
export const getModulesAreas = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT DISTINCT area FROM modulos WHERE area IS NOT NULL AND area != ""
            UNION
            SELECT DISTINCT area FROM cursos WHERE area IS NOT NULL AND area != ""
            ORDER BY area ASC
        `);
        const areas = rows.map(r => r.area);
        return res.json(areas);
    } catch (error) {
        console.error('Erro ao buscar áreas:', error);
        return res.status(500).json({ message: 'Erro ao buscar áreas' });
    }
};
