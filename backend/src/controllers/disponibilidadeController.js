import { db } from '../config/db.js';

// Listar TODAS as disponibilidades (Para Admin/Secretaria)
export const getAllAvailabilities = async (req, res) => {
    try {
        const canView = req.user.role === 'ADMIN' || req.user.role === 'SECRETARIA' || req.user.role === 'FORMADOR';
        if (!canView) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        const [rows] = await db.query(
            `SELECT d.id, d.inicio, d.fim, d.tipo, u.nome_completo as nome_formador, d.id_formador
             FROM disponibilidade_formadores d
             JOIN formadores f ON d.id_formador = f.id
             JOIN utilizadores u ON f.utilizador_id = u.id
             ORDER BY d.inicio ASC`
        );

        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar todas as disponibilidades:', error);
        res.status(500).json({ message: 'Erro ao carregar disponibilidades.' });
    }
};

// Obter a disponibilidade do próprio formador (via token)
export const getMyAvailability = async (req, res) => {
    try {
        const userId = req.user.id;

        const [rows] = await db.query(
            `SELECT d.id, d.inicio, d.fim, d.tipo 
             FROM disponibilidade_formadores d
             JOIN formadores f ON d.id_formador = f.id
             WHERE f.utilizador_id = ?
             ORDER BY d.inicio ASC`,
            [userId]
        );

        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar disponibilidade:', error);
        res.status(500).json({ message: 'Erro ao carregar disponibilidade.' });
    }
};

// Adicionar um novo bloco de disponibilidade
export const addAvailability = async (req, res) => {
    try {
        const userId = req.user.id;
        const { inicio, fim, tipo } = req.body;

        console.log('📝 Tentativa de adicionar disponibilidade:', { userId, inicio, fim, tipo });

        if (!inicio || !fim) {
            return res.status(400).json({ message: 'Início e Fim são obrigatórios.' });
        }

        // Buscar ID do formador
        const [formador] = await db.query('SELECT id FROM formadores WHERE utilizador_id = ?', [userId]);
        if (formador.length === 0) {
            console.warn(`⚠️ Utilizador ${userId} não é um formador registado.`);
            return res.status(403).json({ message: 'Apenas formadores podem definir disponibilidade.' });
        }
        const formadorId = formador[0].id;
        console.log('✅ ID do Formador encontrado:', formadorId);

        // Converter para objeto Date para garantir compatibilidade com o driver mysql2
        const dateInicio = new Date(inicio);
        const dateFim = new Date(fim);

        const [result] = await db.query(
            `INSERT INTO disponibilidade_formadores (id_formador, inicio, fim, tipo) 
             VALUES (?, ?, ?, ?)`,
            [formadorId, dateInicio, dateFim, tipo || 'presencial']
        );

        console.log('🚀 Disponibilidade inserida com sucesso! ID:', result.insertId);

        res.status(201).json({
            id: result.insertId,
            inicio,
            fim,
            tipo: tipo || 'presencial',
            message: 'Disponibilidade adicionada.'
        });
    } catch (error) {
        console.error('❌ Erro crítico ao adicionar disponibilidade:', error);
        res.status(500).json({ message: 'Erro ao adicionar disponibilidade: ' + error.message });
    }
};

// Remover disponibilidade
export const removeAvailability = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Garantir que a disponibilidade pertence ao formador logado
        const [result] = await db.query(
            `DELETE d FROM disponibilidade_formadores d
             JOIN formadores f ON d.id_formador = f.id
             WHERE d.id = ? AND f.utilizador_id = ?`,
            [id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Disponibilidade não encontrada ou não autorizada.' });
        }

        res.json({ message: 'Disponibilidade removida.' });
    } catch (error) {
        console.error('Erro ao remover disponibilidade:', error);
        res.status(500).json({ message: 'Erro ao remover disponibilidade.' });
    }
};
