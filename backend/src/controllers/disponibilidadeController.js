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

// Adicionar disponibilidade (com suporte a repetição OU batch)
export const addAvailability = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const userId = req.user.id;
        // Check for batch input
        let itemsToProcess = [];

        if (req.body.availabilities && Array.isArray(req.body.availabilities)) {
            // Batch mode (Frontend handles recurrence)
            itemsToProcess = req.body.availabilities;
        } else {
            // Legacy/Single mode (Backend handles recurrence)
            // We convert the legacy request into a single item to process, 
            // BUT we must keep the recurrence logic if we want to support legacy calls.
            // However, to fix DST, we strongly prefer the frontend to send the batch.
            // For now, let's just handle the single item as a "seed" and generate the list locally if needed.
            // actually, simpler: if backend recursion is needed, we do it here.

            // ... (Existing legacy logic would go here, but for clarity let's refactor to use a helper or just support batch properly)
            // To minimize risk, if 'availabilities' is NOT present, we assume standard single insertion 
            // and we rely on the EXISTING logic.
            // BUT, I will wrap the existing logic in an 'else' block or just return early.
            // Let's refactor to support both cleanly.
        }

        // Buscar ID do formador
        const [formador] = await connection.query('SELECT id FROM formadores WHERE utilizador_id = ?', [userId]);
        if (formador.length === 0) {
            await connection.rollback();
            return res.status(403).json({ message: 'Apenas formadores podem definir disponibilidade.' });
        }
        const formadorId = formador[0].id;

        let createdCount = 0;

        // BATCH MODE
        if (itemsToProcess.length > 0) {
            for (const item of itemsToProcess) {
                const { inicio, fim, tipo } = item;
                const start = new Date(inicio);
                const end = new Date(fim);

                // Simple overlap check
                const [overlaps] = await connection.query(
                    `SELECT id FROM disponibilidade_formadores 
                     WHERE id_formador = ? 
                     AND inicio < ? AND fim > ?`,
                    [formadorId, end, start]
                );

                if (overlaps.length === 0) {
                    await connection.query(
                        `INSERT INTO disponibilidade_formadores (id_formador, inicio, fim, tipo) 
                         VALUES (?, ?, ?, ?)`,
                        [formadorId, start, end, tipo || 'presencial']
                    );
                    createdCount++;
                }
            }
        } else {
            // LEGACY / BACKEND RECURRENCE MODE (Mantendo lógica original para compatibilidade)
            let { inicio, fim, tipo, repeatUntil, excludeWeekends } = req.body;
            if (excludeWeekends === undefined) excludeWeekends = false;

            if (!inicio || !fim) {
                await connection.rollback();
                return res.status(400).json({ message: 'Início e Fim são obrigatórios.' });
            }

            const baseStart = new Date(inicio);
            const baseEnd = new Date(fim);
            const limitDate = repeatUntil ? new Date(repeatUntil) : new Date(baseStart);
            limitDate.setHours(23, 59, 59, 999);

            let currentStart = new Date(baseStart);
            let currentEnd = new Date(baseEnd); // Note: currentEnd logic in legacy loop had issues with date math if not careful.

            // ... (Copying the Fixed Loop from previous step)
            while (currentStart <= limitDate) {
                const dayOfWeek = currentStart.getDay();

                if (excludeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
                    currentStart.setDate(currentStart.getDate() + 1);
                    // Legacy loop updated end by adding 1 day too. 
                    // To be safe we should re-calculate end based on start each time to avoid drift, 
                    // but the previous "fix" forced normalizedEnd calculation anyway.
                    continue; // Wait, previous code incremented at end of loop. Here we need to be careful.
                }

                // Normalização (Logic from Step 1097 fix)
                const thisStart = new Date(currentStart);
                const thisEnd = new Date(currentStart);
                thisEnd.setHours(baseEnd.getHours(), baseEnd.getMinutes(), 0, 0);

                if (baseEnd.getHours() < baseStart.getHours() ||
                    (baseEnd.getHours() === baseStart.getHours() && baseEnd.getMinutes() < baseStart.getMinutes())) {
                    thisEnd.setDate(thisEnd.getDate() + 1);
                }

                // Overlap Check...
                const [overlapsSimple] = await connection.query(
                    `SELECT id FROM disponibilidade_formadores 
                     WHERE id_formador = ? 
                     AND inicio < ? AND fim > ?`,
                    [formadorId, thisEnd, thisStart]
                );

                if (overlapsSimple.length === 0) {
                    await connection.query(
                        `INSERT INTO disponibilidade_formadores (id_formador, inicio, fim, tipo) 
                         VALUES (?, ?, ?, ?)`,
                        [formadorId, thisStart, thisEnd, tipo || 'presencial']
                    );
                    createdCount++;
                }

                // Increment
                currentStart.setDate(currentStart.getDate() + 1);
            }
        }

        await connection.commit();
        res.status(201).json({
            message: `Sucesso! Foram criados ${createdCount} blocos de disponibilidade.`,
            count: createdCount
        });

    } catch (error) {
        await connection.rollback();
        console.error('Erro ao adicionar disponibilidade:', error);
        res.status(500).json({ message: 'Erro ao adicionar disponibilidade: ' + error.message });
    } finally {
        connection.release();
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

// Remover TODA a disponibilidade do formador (Limpar Tudo)
export const deleteAllAvailability = async (req, res) => {
    try {
        const userId = req.user.id;

        // Buscar ID do formador
        const [formador] = await db.query('SELECT id FROM formadores WHERE utilizador_id = ?', [userId]);
        if (formador.length === 0) {
            return res.status(403).json({ message: 'Apenas formadores podem gerir disponibilidade.' });
        }
        const formadorId = formador[0].id;

        // Remover tudo onde id_formador = formadorId
        // Vamos assumir remover DO FUTURO (>= NOW) para não estragar relatórios passados.
        const now = new Date();

        const [result] = await db.query(
            `DELETE FROM disponibilidade_formadores 
             WHERE id_formador = ? AND inicio >= ?`,
            [formadorId, now]
        );

        console.log(`Disponibilidade limpa para formador ${formadorId}. ${result.affectedRows} registos removidos.`);

        res.json({
            message: 'Toda a disponibilidade futura foi removida com sucesso.',
            count: result.affectedRows
        });

    } catch (error) {
        console.error('Erro ao limpar disponibilidade:', error);
        res.status(500).json({ message: 'Erro ao limpar disponibilidade.' });
    }
};
