import { db } from '../config/db.js';

// Listar todos os modulos
// Listar todos os modulos com paginação
export const getModules = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM modulos';
        const params = [];

        if (search) {
            query += ' WHERE nome_modulo LIKE ?';
            params.push(`%${search}%`);
        }

        query += ' ORDER BY nome_modulo ASC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [modules] = await db.query(query, params);

        // Count for pagination
        let countQuery = 'SELECT COUNT(*) as total FROM modulos';
        const countParams = [];

        if (search) {
            countQuery += ' WHERE nome_modulo LIKE ?';
            countParams.push(`%${search}%`);
        }

        const [totalCount] = await db.query(countQuery, countParams);

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
        const { nome_modulo, carga_horaria } = req.body;

        if (!nome_modulo || !carga_horaria) {
            return res.status(400).json({ message: 'Nome do módulo e carga horária são obrigatórios' });
        }

        const [result] = await db.query(
            'INSERT INTO modulos (nome_modulo, carga_horaria) VALUES (?, ?)',
            [nome_modulo, carga_horaria]
        );

        return res.status(201).json({
            id: result.insertId,
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
