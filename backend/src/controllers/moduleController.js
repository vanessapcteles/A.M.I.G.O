import { db } from '../config/db.js';

// Listar todos os modulos com paginação
export const getModules = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, courseId, area } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT DISTINCT m.* FROM modulos m'; 
        const params = [];

        if (courseId) {
            query += ' JOIN curso_modulos cm ON m.id = cm.id_modulo';
        }

        let whereClauses = [];

        if (courseId) {
            whereClauses.push('cm.id_curso = ?');
            params.push(courseId);
        }

        if (area) {
            whereClauses.push('m.area = ?'); 
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

        // Contagem para paginação
        let countQuery = 'SELECT COUNT(DISTINCT m.id) as total FROM modulos m';

        if (courseId) {
            countQuery += ' JOIN curso_modulos cm ON m.id = cm.id_modulo';
        }

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
            // Aqui vamos direto ao try/catch da FK

            // Calcular próxima sequência
            const [rows] = await db.query('SELECT MAX(sequencia) as maxSeq FROM curso_modulos WHERE id_curso = ?', [courseId]);
            const nextSeq = (rows[0].maxSeq !== null) ? rows[0].maxSeq + 1 : 0;

            await db.query(
                'INSERT INTO curso_modulos (id_curso, id_modulo, sequencia, horas_padrao) VALUES (?, ?, ?, ?)',
                [courseId, newModuleId, nextSeq, carga_horaria] // dynamic sequence, horas_padrao = carga_horaria
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
        const areasSet = new Set(rows.map(r => r.area));
        areasSet.add('Outra'); 
        const areas = Array.from(areasSet).sort();
        return res.json(areas);
    } catch (error) {
        console.error('Erro ao buscar áreas:', error);
        return res.status(500).json({ message: 'Erro ao buscar áreas' });
    }
};

// Renomear ou Fundir Área
export const updateArea = async (req, res) => {
    try {
        const { currentName } = req.params;
        const { newName } = req.body;

        if (!currentName || !newName) {
            return res.status(400).json({ message: 'Nomes da área inválidos' });
        }

        // Update Modules
        await db.query('UPDATE modulos SET area = ? WHERE area = ?', [newName, currentName]);
        // Update Courses
        await db.query('UPDATE cursos SET area = ? WHERE area = ?', [newName, currentName]);

        return res.status(200).json({ message: 'Área atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar área:', error);
        return res.status(500).json({ message: 'Erro ao atualizar área' });
    }
};

// Eliminar Área (Cascade Delete Cursos, Nullify Modulos)
export const deleteArea = async (req, res) => {
    try {
        const { areaName } = req.params;

        if (!areaName) {
            return res.status(400).json({ message: 'Nome da área inválido' });
        }

        // Preserva modulos caso sejam usados em cursos
        await db.query('UPDATE modulos SET area = NULL WHERE area = ?', [areaName]);

        // Elimina cursos associados a esta área
        await db.query('DELETE FROM cursos WHERE area = ?', [areaName]);

        return res.status(200).json({ message: 'Área eliminada com sucesso' });
    } catch (error) {
        console.error('Erro ao eliminar área:', error);
        return res.status(500).json({ message: 'Erro ao eliminar área' });
    }
};
