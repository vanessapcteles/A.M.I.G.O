
import { db } from '../config/db.js';

// Listar alunos de uma turma/módulo para avaliação
export const getStudentsForEvaluation = async (req, res) => {
    try {
        const { turmaId, moduloId } = req.params;
        const userId = req.user.id; // Formador logado

        // Verificar se o formador tem permissão para esta turma/módulo
        const [permission] = await db.query(
            `SELECT td.id FROM turma_detalhes td
             JOIN formadores f ON td.id_formador = f.id
             WHERE td.id_turma = ? AND td.id_modulo = ? AND f.utilizador_id = ?`,
            [turmaId, moduloId, userId]
        );

        const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SECRETARIA';

        if (permission.length === 0 && !isAdmin) {
            return res.status(403).json({ message: 'Não tem permissão para avaliar este módulo nesta turma.' });
        }

        // Buscar alunos inscritos na turma e as suas notas atuais (se existirem)
        const [students] = await db.query(
            `SELECT 
                i.id as id_inscricao, 
                u.nome_completo, 
                u.email, 
                a.nota, 
                a.observacoes, 
                a.id as id_avaliacao
             FROM inscricoes i
             JOIN formandos f ON i.id_formando = f.id
             JOIN utilizadores u ON f.utilizador_id = u.id
             LEFT JOIN avaliacoes a ON a.id_inscricao = i.id AND a.id_modulo = ?
             WHERE i.id_turma = ? AND i.estado = 'APROVADO'
             ORDER BY u.nome_completo ASC`,
            [moduloId, turmaId]
        );

        res.json(students);
    } catch (error) {
        console.error('Erro ao buscar alunos para avaliação:', error);
        res.status(500).json({ message: 'Erro ao carregar lista de alunos.' });
    }
};

// Lançar/Atualizar notas em lote
export const submitGrades = async (req, res) => {
    try {
        const { moduloId, grades } = req.body; // grades: [{ id_inscricao, nota, observacoes }]
        const userId = req.user.id;

        if (!moduloId || !Array.isArray(grades)) {
            return res.status(400).json({ message: 'Dados inválidos.' });
        }

        // Loop para processar cada nota
        for (const g of grades) {
            const { id_inscricao, nota, observacoes } = g;

            // Validar nota (0-20)
            const numNota = parseFloat(nota);
            if (isNaN(numNota) || numNota < 0 || numNota > 20) continue;

            // INSERT ... ON DUPLICATE KEY UPDATE
            await db.query(
                `INSERT INTO avaliacoes (id_inscricao, id_modulo, nota, observacoes, data_avaliacao)
                 VALUES (?, ?, ?, ?, NOW())
                 ON DUPLICATE KEY UPDATE nota = VALUES(nota), observacoes = VALUES(observacoes), data_avaliacao = NOW()`,
                [id_inscricao, moduloId, numNota, observacoes || '']
            );
        }

        res.json({ message: 'Notas submetidas com sucesso!' });
    } catch (error) {
        console.error('Erro ao submeter notas:', error);
        res.status(500).json({ message: 'Erro ao guardar avaliações.' });
    }
};
