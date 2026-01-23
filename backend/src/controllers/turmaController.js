import { db } from '../config/db.js';

// Listar todas as turmas (com join para o curso)
export const getTurmas = async (req, res) => {
    try {
        const [turmas] = await db.query(`
            SELECT t.*, c.nome_curso 
            FROM turmas t 
            JOIN cursos c ON t.id_curso = c.id 
            ORDER BY t.data_inicio DESC
        `);
        return res.status(200).json(turmas);
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

        return res.status(201).json({
            id: result.insertId,
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
