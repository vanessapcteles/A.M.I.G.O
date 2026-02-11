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

        // Validar se tem recursos atribuídos
        if (!id_formador || !id_sala) {
            return res.status(400).json({
                message: 'Não é possível agendar: O módulo deve ter Formador e Sala atribuídos na gestão da turma.'
            });
        }

        // Formatar datas para MySQL usando objetos Date (mysql2 trata a conversão)
        const dateInicio = new Date(inicio);
        const dateFim = new Date(fim);

        console.log('Agendando aula:', {
            id_turma_detalhe,
            inicio: dateInicio.toISOString(),
            fim: dateFim.toISOString()
        });

        // 2.5 Validar Disponibilidade do Formador
        const [availability] = await db.query(
            `SELECT 1 FROM disponibilidade_formadores 
             WHERE id_formador = ? 
             AND inicio <= ? AND fim >= ?`,
            [id_formador, dateInicio, dateFim]
        );

        if (availability.length === 0) {
            return res.status(400).json({
                message: 'O formador não tem disponibilidade registada para este horário.'
            });
        }

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

// Limpar todo o horário da turma
export const deleteAllTurmaSchedule = async (req, res) => {
    try {
        const { turmaId } = req.params;

        // Apaga todas as aulas cujos detalhes pertençam a esta turma
        await db.query(`
            DELETE h 
            FROM horarios_aulas h
            JOIN turma_detalhes td ON h.id_turma_detalhe = td.id
            WHERE td.id_turma = ?
        `, [turmaId]);

        return res.json({ message: 'Horário da turma limpo com sucesso.' });
    } catch (error) {
        console.error('Erro ao limpar horário:', error);
        return res.status(500).json({ message: 'Erro ao limpar horário da turma.' });
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
// GERADOR AUTOMÁTICO DE HORÁRIOS (O "CÉREBRO")
export const autoGenerateSchedule = async (req, res) => {
    const { turmaId } = req.params;
    const { dataInicio, regime } = req.body; // regime: 'diurno' | 'pos_laboral'

    if (!dataInicio) return res.status(400).json({ message: 'Data de início é obrigatória.' });

    try {
        // 1. Obter detalhes e calcular horas restantes
        const [detalhesOriginal] = await db.query(`
            SELECT td.*, m.nome_modulo, m.carga_horaria 
            FROM turma_detalhes td
            JOIN modulos m ON td.id_modulo = m.id
            WHERE td.id_turma = ?
            ORDER BY td.sequencia ASC
        `, [turmaId]);

        if (detalhesOriginal.length === 0) return res.status(400).json({ message: 'A turma não tem módulos atribuídos.' });

        // --- VALIDATION: Check if trainers have availability for the selected regime ---
        const uniqueFormadores = [...new Set(detalhesOriginal.map(d => d.id_formador).filter(id => id))];
        const missingAvailability = [];

        for (const fId of uniqueFormadores) {
            // Logic: Do they have ANY slots starting >= dataInicio matching the regime hours?
            // Pos-Laboral: Starts >= 16:00
            // Diurno: Starts < 18:00 (approx)
            let timeCheck = '';
            if (regime === 'pos_laboral') {
                timeCheck = 'AND HOUR(inicio) >= 16';
            } else {
                timeCheck = 'AND HOUR(inicio) < 18';
            }

            const [check] = await db.query(`
                SELECT 1 FROM disponibilidade_formadores 
                WHERE id_formador = ? 
                AND inicio >= ? 
                ${timeCheck}
                LIMIT 1
            `, [fId, dataInicio]);

            if (check.length === 0) {
                // Get trainer name for better error message
                const [trainerName] = await db.query('SELECT u.nome_completo FROM formadores f JOIN utilizadores u ON f.utilizador_id = u.id WHERE f.id = ?', [fId]);
                if (trainerName.length > 0) missingAvailability.push(trainerName[0].nome_completo);
                else missingAvailability.push(`Formador ${fId}`);
            }
        }

        if (missingAvailability.length > 0) {
            return res.status(400).json({
                message: `Não é possível gerar horário ${regime === 'pos_laboral' ? 'Pós-Laboral' : 'Diurno'}. 
                Os seguintes formadores não têm disponibilidade registada para este regime a partir de ${dataInicio}: 
                ${missingAvailability.join(', ')}. 
                Por favor adicione disponibilidade ou mude o regime.`
            });
        }
        // ---------------------------------------------------------------------------

        let modulesWorkList = [];
        for (let m of detalhesOriginal) {
            const [check] = await db.query(`
                SELECT COALESCE(SUM(TIMESTAMPDIFF(SECOND, inicio, fim)) / 3600, 0) as agendado
                FROM horarios_aulas WHERE id_turma_detalhe = ?
            `, [m.id]);

            modulesWorkList.push({
                ...m,
                horasRestantes: m.horas_planeadas - parseFloat(check[0].agendado)
            });
        }

        let lessonsCreated = 0;
        let searchCursor = new Date(dataInicio);
        // Default to configured slots based on regime
        // Diurno: 08:00, Noturno: 16:00 (start of first slot)
        const startHour = regime === 'pos_laboral' ? 16 : 8;
        searchCursor.setHours(startHour, 0, 0, 0);

        let allDone = false;
        let safetyCounter = 0;

        // WEEKLY LOOP
        while (!allDone && safetyCounter < 1000) {
            allDone = true;

            // 1. Identify active pool for this week (Max 4 incomplete modules)
            const activeModules = modulesWorkList.filter(m => m.horasRestantes > 0).slice(0, 4);

            if (activeModules.length === 0) {
                break; // No more work
            }
            allDone = false;

            // Iterate 5 days of the week (Mon-Fri)
            for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
                // Ensure we skip weekends if searchCursor is Sat/Sun
                while (searchCursor.getDay() === 0 || searchCursor.getDay() === 6) {
                    searchCursor.setDate(searchCursor.getDate() + 1);
                }

                // Define Slots for the day based on Regime
                const slots = [];
                const baseDate = new Date(searchCursor);

                if (regime === 'pos_laboral') {
                    // Noturno: 16-19, 20-23
                    slots.push({ startHour: 16, endHour: 19 });
                    slots.push({ startHour: 20, endHour: 23 });
                } else {
                    // Diurno: 08-11, 12-15
                    slots.push({ startHour: 8, endHour: 11 });
                    slots.push({ startHour: 12, endHour: 15 });
                }

                // Try to fill each slot
                for (let slot of slots) {
                    // Find a module that can take this slot
                    // We rotate through activeModules to ensure diversity
                    // Simple strategy: Try 1st, then 2nd...
                    let slotFilled = false;

                    for (let modulo of activeModules) {
                        if (modulo.horasRestantes <= 0) continue;
                        if (!modulo.id_formador || !modulo.id_sala) continue;

                        const duration = 3; // Fixed 3h slots as requested
                        if (modulo.horasRestantes < duration && modulo.horasRestantes > 0) {
                            // If < 3h remaining, we might skip or schedule partial?
                            // User strictness implies 3h blocks. Let's schedule keeping 3h slot but updating remaining.
                            // Or strictly only schedule if >= 3? Let's allow partial last lesson.
                        }

                        const slotStart = new Date(baseDate);
                        slotStart.setHours(slot.startHour, 0, 0, 0);
                        const slotEnd = new Date(baseDate);
                        slotEnd.setHours(slot.endHour, 0, 0, 0);

                        // Check availability strictly covering this slot
                        const [available] = await db.query(`
                            SELECT * FROM disponibilidade_formadores 
                            WHERE id_formador = ? 
                            AND inicio <= ? AND fim >= ?
                        `, [modulo.id_formador, slotStart, slotEnd]);

                        if (available.length > 0) {
                            // Check conflicts
                            const [conflicts] = await db.query(`
                                SELECT h.id FROM horarios_aulas h
                                JOIN turma_detalhes td ON h.id_turma_detalhe = td.id
                                WHERE (td.id_sala = ? OR td.id_turma = ?)
                                AND ? < h.fim AND ? > h.inicio
                            `, [modulo.id_sala, modulo.id_turma, slotStart, slotEnd]);

                            if (conflicts.length === 0) {
                                // Schedule it
                                await db.query(`
                                    INSERT INTO horarios_aulas (id_turma_detalhe, inicio, fim) 
                                    VALUES (?, ?, ?)
                                `, [modulo.id, slotStart, slotEnd]);

                                modulo.horasRestantes -= duration;
                                lessonsCreated++;
                                slotFilled = true;

                                // Rotate active modules to give others a chance in next slot
                                // (Simply moving this module to end of active list for next iteration priority)
                                const idx = activeModules.indexOf(modulo);
                                if (idx > -1) {
                                    activeModules.push(activeModules.splice(idx, 1)[0]);
                                }
                                break; // Slot filled, move to next slot
                            }
                        }
                    }
                }

                // Move cursor to next day
                searchCursor.setDate(searchCursor.getDate() + 1);
            }

            // Logic to advance week if stuck? 
            // In this specific structure, we just loop until all hours are done.
            // The searchCursor naturally advances.
            safetyCounter++;
        }

        return res.json({
            message: `Sucesso! Foram geradas ${lessonsCreated} aulas (${regime}).`,
            lessonsCreated
        });

    } catch (error) {
        console.error('Erro na geração automática:', error);
        return res.status(500).json({ message: 'Erro interno ao gerar horário.' });
    }
};
