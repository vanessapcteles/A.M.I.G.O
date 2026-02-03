import { db } from '../config/db.js';

// Listar cursos com paginação e filtros
export const getCourses = async (req, res) => {
    try {
        const { page = 1, limit = 10, estado, search } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT c.*, 
            (SELECT MIN(t.data_inicio) FROM turmas t WHERE t.id_curso = c.id AND t.data_inicio >= CURDATE()) as proxima_data_inicio
            FROM cursos c
        `;
        const params = [];

        if (estado && estado !== 'all') {
            if (estado === 'brevemente') {
                query += " JOIN turmas t_filter ON c.id = t_filter.id_curso WHERE t_filter.data_inicio BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 60 DAY)";
            } else {
                query += " WHERE c.estado = ?";
                params.push(estado);
            }
        } else {
            query += " WHERE 1=1";
        }

        if (search) {
            query += " AND (c.nome_curso LIKE ? OR c.area LIKE ?)";
            params.push(`%${search}%`, `%${search}%`);
        }

        if (estado === 'brevemente') {
            query += " GROUP BY c.id";
        }

        query += " ORDER BY c.nome_curso ASC LIMIT ? OFFSET ?";
        params.push(parseInt(limit), parseInt(offset));

        const [courses] = await db.query(query, params);

        // Count for pagination
        let countQuery = "SELECT COUNT(DISTINCT c.id) as total FROM cursos c";
        const countParams = [];

        if (estado === 'brevemente') {
            countQuery += " JOIN turmas t ON c.id = t.id_curso WHERE t.data_inicio BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 60 DAY)";
        } else {
            countQuery += " WHERE 1=1";
            if (estado && estado !== 'all') {
                countQuery += " AND c.estado = ?";
                countParams.push(estado);
            }
        }

        if (search) {
            countQuery += " AND (c.nome_curso LIKE ? OR c.area LIKE ?)";
            countParams.push(`%${search}%`, `%${search}%`);
        }
        const [totalCount] = await db.query(countQuery, countParams);

        return res.status(200).json({
            courses,
            total: totalCount[0].total,
            pages: Math.ceil(totalCount[0].total / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        console.error('Erro ao listar cursos:', error);
        return res.status(500).json({ message: 'Erro ao listar cursos' });
    }
};

// Criar novo curso
export const createCourse = async (req, res) => {
    try {
        const { nome_curso, area, estado } = req.body;

        if (!nome_curso || !area) {
            return res.status(400).json({ message: 'Nome do curso e área são obrigatórios' });
        }

        const [result] = await db.query(
            'INSERT INTO cursos (nome_curso, area, estado) VALUES (?, ?, ?)',
            [nome_curso, area, estado || 'planeado']
        );

        return res.status(201).json({
            id: result.insertId,
            message: 'Curso criado com sucesso!'
        });
    } catch (error) {
        console.error('Erro ao criar curso:', error);
        return res.status(500).json({ message: 'Erro ao criar curso' });
    }
};

// Atualizar curso
export const updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome_curso, area, estado } = req.body;

        const [result] = await db.query(
            'UPDATE cursos SET nome_curso = ?, area = ?, estado = ? WHERE id = ?',
            [nome_curso, area, estado, id]
        );

        if (result.affectedRows === 0) return res.status(404).json({ message: 'Curso não encontrado' });

        return res.status(200).json({ message: 'Curso atualizado com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar curso:', error);
        return res.status(500).json({ message: 'Erro ao atualizar curso' });
    }
};

// Eliminar curso
export const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar se existem turmas associadas
        const [turmas] = await db.query('SELECT id FROM turmas WHERE id_curso = ? LIMIT 1', [id]);
        if (turmas.length > 0) {
            return res.status(400).json({ message: 'Erro: Não é possível eliminar cursos com turmas atribuídas.' });
        }

        await db.query('DELETE FROM cursos WHERE id = ?', [id]);
        return res.status(200).json({ message: 'Curso eliminado com sucesso' });
    } catch (error) {
        console.error('Erro ao eliminar curso:', error);
        return res.status(500).json({ message: 'Erro ao eliminar curso' });
    }
};
