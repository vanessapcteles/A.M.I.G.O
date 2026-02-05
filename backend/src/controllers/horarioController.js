import { db } from '../config/db.js';

// Listar horários de uma Turma
export const getTurmaSchedule = async (req, res) => {
    try {
        const { turmaId } = req.params;
        const { start, end } = req.query;

        let query = `
            SELECT 
                h.id, 
                h.inicio, 
                h.fim, 
                m.nome_modulo,
                u.nome_completo as nome_formador,
                s.nome_sala,
                td.id as id_turma_detalhe
            FROM horarios_aulas h
            JOIN turma_detalhes td ON h.id_turma_detalhe = td.id
            JOIN modulos m ON td.id_modulo = m.id
            JOIN formadores f ON td.id_formador = f.id
            JOIN utilizadores u ON f.utilizador_id = u.id
            JOIN salas s ON td.id_sala = s.id
            WHERE td.id_turma = ?
        `;
        let params = [turmaId];

        if (start && end) {
            query += ` AND h.inicio >= ? AND h.inicio <= ?`;
            params.push(start, end);
        }

        query += ` ORDER BY h.inicio ASC`;

        const [aulas] = await db.query(query, params);
        return res.json(aulas);
    } catch (error) {
        console.error('Erro ao listar horários:', error);
        return res.status(500).json({ message: 'Erro ao carregar horários' });
    }
};

// Criar aula (Agendar)
export const createLesson = async (req, res) => {
    try {
        const { id_turma_detalhe, inicio, fim } = req.body;

        if (!id_turma_detalhe || !inicio || !fim) {
            return res.status(400).json({ message: 'Dados incompletos' });
        }

        const start = new Date(inicio);
        const end = new Date(fim);

        // 1. Validar duração Max 3h
        const durationMs = end - start;
        const durationHours = durationMs / (1000 * 60 * 60);

        if (durationHours > 3) {
            return res.status(400).json({ message: 'A duração máxima de uma aula é de 3 horas.' });
        }
        if (durationHours <= 0) {
            return res.status(400).json({ message: 'A data de fim deve ser posterior à de início.' });
        }

        // 2. Detetar Conflitos e Validar Carga Horária
        // Obter recursos e limites (sala, formador, turma e horas totais do módulo)
        const [detalhes] = await db.query(`
            SELECT td.id_sala, td.id_formador, td.id_turma, td.horas_planeadas, m.nome_modulo
            FROM turma_detalhes td
            JOIN modulos m ON td.id_modulo = m.id
            WHERE td.id = ?
        `, [id_turma_detalhe]);

        if (detalhes.length === 0) return res.status(404).json({ message: 'Módulo/Detalhe não encontrado' });

        const { id_sala, id_formador, id_turma, horas_planeadas, nome_modulo } = detalhes[0];

        // Formatar datas para MySQL usando objetos Date (mysql2 trata a conversão)
        const dateInicio = new Date(inicio);
        const dateFim = new Date(fim);

        console.log('Agendando aula:', {
            id_turma_detalhe,
            inicio: dateInicio.toISOString(),
            fim: dateFim.toISOString()
        });

        // 3. Validar se ultrapassa as horas planeadas
        const [hourCheck] = await db.query(`
            SELECT COALESCE(SUM(TIMESTAMPDIFF(SECOND, inicio, fim)) / 3600, 0) as horas_agendadas
            FROM horarios_aulas 
            WHERE id_turma_detalhe = ?
        `, [id_turma_detalhe]);

        const horasAgendadas = parseFloat(hourCheck[0].horas_agendadas);
        if (horasAgendadas + durationHours > horas_planeadas) {
            return res.status(400).json({
                message: `Limite de horas excedido para o módulo ${nome_modulo}. Planeado: ${horas_planeadas}h, Já agendado: ${horasAgendadas}h, Tentativa: ${durationHours}h.`
            });
        }

        // 4. Verificar sobreposição genérica
        const [conflicts] = await db.query(`
            SELECT h.id, 'Sala' as tipo
            FROM horarios_aulas h
            JOIN turma_detalhes td ON h.id_turma_detalhe = td.id
            WHERE td.id_sala = ? 
            AND ? < h.fim AND ? > h.inicio
            
            UNION ALL
            
            SELECT h.id, 'Formador' as tipo
            FROM horarios_aulas h
            JOIN turma_detalhes td ON h.id_turma_detalhe = td.id
            WHERE td.id_formador = ?
            AND ? < h.fim AND ? > h.inicio

            UNION ALL

            SELECT h.id, 'Turma' as tipo
            FROM horarios_aulas h
            JOIN turma_detalhes td ON h.id_turma_detalhe = td.id
            WHERE td.id_turma = ?
            AND ? < h.fim AND ? > h.inicio
        `, [
            id_sala, dateInicio, dateFim,
            id_formador, dateInicio, dateFim,
            id_turma, dateInicio, dateFim
        ]);

        if (conflicts.length > 0) {
            const types = [...new Set(conflicts.map(c => c.tipo))].join(', ');
            return res.status(409).json({ message: `Conflito de horário detetado: ${types} já ocupado(a) neste intervalo.` });
        }

        await db.query('INSERT INTO horarios_aulas (id_turma_detalhe, inicio, fim) VALUES (?, ?, ?)',
            [id_turma_detalhe, dateInicio, dateFim]);

        return res.status(201).json({ message: 'Aula agendada com sucesso' });

    } catch (error) {
        console.error('ERRO CRÍTICO AO AGENDAR:', error);
        return res.status(500).json({ message: error.sqlMessage || 'Erro ao agendar aula' });
    }
};

// Remover aula
export const deleteLesson = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM horarios_aulas WHERE id = ?', [id]);
        return res.json({ message: 'Aula removida' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao remover aula' });
    }
};
// Listar horários de um Formador
export const getFormadorSchedule = async (req, res) => {
    try {
        const { userId } = req.params;
        const { start, end } = req.query;

        let query = `
            SELECT 
                h.id, h.inicio, h.fim, m.nome_modulo,
                t.codigo_turma, s.nome_sala
            FROM horarios_aulas h
            JOIN turma_detalhes td ON h.id_turma_detalhe = td.id
            JOIN modulos m ON td.id_modulo = m.id
            JOIN turmas t ON td.id_turma = t.id
            JOIN formadores f ON td.id_formador = f.id
            JOIN salas s ON td.id_sala = s.id
            WHERE f.utilizador_id = ?
        `;
        let params = [userId];

        if (start && end) {
            query += ` AND h.inicio >= ? AND h.inicio <= ?`;
            params.push(start, end);
        }

        query += ` ORDER BY h.inicio ASC`;

        const [aulas] = await db.query(query, params);
        return res.json(aulas);
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao carregar horário do formador' });
    }
};

// Listar ocupação de uma Sala
export const getRoomSchedule = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { start, end, dia } = req.query;

        let query = `
            SELECT 
                h.id, h.inicio, h.fim, m.nome_modulo,
                t.codigo_turma, u.nome_completo as nome_formador
            FROM horarios_aulas h
            JOIN turma_detalhes td ON h.id_turma_detalhe = td.id
            JOIN modulos m ON td.id_modulo = m.id
            JOIN turmas t ON td.id_turma = t.id
            JOIN formadores f ON td.id_formador = f.id
            JOIN utilizadores u ON f.utilizador_id = u.id
            WHERE td.id_sala = ?
        `;
        let params = [roomId];

        if (dia) {
            query += ` AND DATE(h.inicio) = ?`;
            params.push(dia);
        } else if (start && end) {
            query += ` AND h.inicio >= ? AND h.inicio <= ?`;
            params.push(start, end);
        }

        query += ` ORDER BY h.inicio ASC`;

        const [aulas] = await db.query(query, params);
        return res.json(aulas);
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao carregar ocupação da sala' });
    }
};
// Listar TODOS os horários (Global)
export const listAllLessons = async (req, res) => {
    try {
        const { start, end } = req.query;
        const user = req.user; // Obtido pelo middleware authenticateToken

        let query = `
            SELECT 
                h.id, 
                h.inicio, 
                h.fim, 
                m.nome_modulo,
                u.nome_completo as nome_formador,
                s.nome_sala,
                t.codigo_turma
            FROM horarios_aulas h
            JOIN turma_detalhes td ON h.id_turma_detalhe = td.id
            JOIN modulos m ON td.id_modulo = m.id
            JOIN turmas t ON td.id_turma = t.id
            JOIN formadores f ON td.id_formador = f.id
            JOIN utilizadores u ON f.utilizador_id = u.id
            JOIN salas s ON td.id_sala = s.id
        `;

        const params = [];

        // Se for Formando, filtrar apenas pela sua turma
        if (user.role === 'FORMANDO') {
            query += `
                JOIN inscricoes i ON t.id = i.id_turma
                JOIN formandos frm ON i.id_formando = frm.id
                WHERE frm.utilizador_id = ?
            `;
            params.push(user.id);
        } else {
            query += ` WHERE 1=1`;
        }

        const { formadorId, turmaId } = req.query;

        if (formadorId) {
            query += ` AND f.id = ?`;
            params.push(formadorId);
        }

        if (turmaId) {
            query += ` AND t.id = ?`;
            params.push(turmaId);
        }

        if (start && end) {
            query += ` AND h.inicio >= ? AND h.inicio <= ?`;
            params.push(start, end);
        }

        query += ` ORDER BY h.inicio ASC`;

        const [aulas] = await db.query(query, params);
        return res.json(aulas);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao carregar todos os horários' });
    }
};
