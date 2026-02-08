import { db } from '../config/db.js';

// Listar todas as salas
export const getRooms = async (req, res) => {
    try {
        // Colunas reais na DB: id, nome_sala, capacidade, localizacao
        const [rooms] = await db.query('SELECT id, nome_sala, capacidade, localizacao FROM salas ORDER BY nome_sala ASC');
        return res.status(200).json(rooms);
    } catch (error) {
        console.error('Erro ao listar salas:', error);
        return res.status(500).json({ message: 'Erro ao listar salas' });
    }
};

// Criar nova sala
export const createRoom = async (req, res) => {
    try {
        const { nome, capacidade, localizacao } = req.body;

        if (!nome || !capacidade) {
            return res.status(400).json({ message: 'Nome e capacidade são obrigatórios' });
        }

        // Usando nome_sala, capacidade, localizacao
        const [result] = await db.query(
            'INSERT INTO salas (nome_sala, capacidade, localizacao) VALUES (?, ?, ?)',
            [nome, capacidade, localizacao || 'Edifício Principal']
        );

        return res.status(201).json({
            id: result.insertId,
            message: 'Sala criada com sucesso!'
        });
    } catch (error) {
        console.error('Erro ao criar sala:', error);
        return res.status(500).json({ message: 'Erro ao criar sala na base de dados' });
    }
};

// Atualizar sala
export const updateRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, capacidade, localizacao } = req.body;

        const [result] = await db.query(
            'UPDATE salas SET nome_sala = ?, capacidade = ?, localizacao = ? WHERE id = ?',
            [nome, capacidade, localizacao, id]
        );

        if (result.affectedRows === 0) return res.status(404).json({ message: 'Sala não encontrada' });

        return res.status(200).json({ message: 'Sala atualizada com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar sala:', error);
        return res.status(500).json({ message: 'Erro ao atualizar sala' });
    }
};

// Eliminar sala
export const deleteRoom = async (req, res) => {
    try {
        const { id } = req.params;

        await db.query('DELETE FROM salas WHERE id = ?', [id]);
        return res.status(200).json({ message: 'Sala eliminada com sucesso' });
    } catch (error) {
        console.error('Erro ao eliminar sala:', error);
        return res.status(500).json({ message: 'Erro ao eliminar sala' });
    }
};
