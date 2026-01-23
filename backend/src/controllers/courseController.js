import { db } from '../config/db.js';

// Listar todos os cursos
export const getCourses = async (req, res) => {
    try {
        const [courses] = await db.query('SELECT * FROM cursos ORDER BY nome_curso ASC');
        return res.status(200).json(courses);
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
            return res.status(400).json({ message: 'Não é possível eliminar um curso que tenha turmas associadas.' });
        }

        await db.query('DELETE FROM cursos WHERE id = ?', [id]);
        return res.status(200).json({ message: 'Curso eliminado com sucesso' });
    } catch (error) {
        console.error('Erro ao eliminar curso:', error);
        return res.status(500).json({ message: 'Erro ao eliminar curso' });
    }
};
