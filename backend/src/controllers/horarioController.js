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

        // Valida duração Max 3h
        const durationMs = end - start;
        const durationHours = durationMs / (1000 * 60 * 60);

        if (durationHours > 3) {
            return res.status(400).json({ message: 'A duração máxima de uma aula é de 3 horas.' });
        }
        if (durationHours <= 0) {
            return res.status(400).json({ message: 'A data de fim deve ser posterior à de início.' });
        }

        // Deteta conflitos e valida carga horária
        // Obter recursos e limites (sala, formador, turma e horas totais do módulo)
        const [detalhes] = await db.query(`
            SELECT td.id_sala, td.id_formador, td.id_turma, td.horas_planeadas, m.nome_modulo
            FROM turma_detalhes td
            JOIN modulos m ON td.id_modulo = m.id
            WHERE td.id = ?
        `, [id_turma_detalhe]);

        if (detalhes.length === 0) return res.status(404).json({ message: 'Módulo/Detalhe não encontrado' });

        const { id_sala, id_formador, id_turma, horas_planeadas, nome_modulo } = detalhes[0];

        // Valida se tem recursos atribuídos
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

        // Valida disponibilidade do formador
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

        // Valida se ultrapassa as horas planeadas
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

        // Verifica sobreposição genérica
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
// Gerador de horários automático 
export const autoGenerateSchedule = async (req, res) => {
    const { turmaId } = req.params;
    const { dataInicio, regime } = req.body; // regime: 'diurno' | 'pos_laboral'

    if (!dataInicio) return res.status(400).json({ message: 'Data de início é obrigatória.' });

    try {
        // Preparação dos dados
        // Carregar módulos ordenados pela sequência
        const [detalhesOriginal] = await db.query(`
            SELECT td.*, m.nome_modulo, m.carga_horaria 
            FROM turma_detalhes td
            JOIN modulos m ON td.id_modulo = m.id
            WHERE td.id_turma = ?
            ORDER BY td.sequencia ASC
        `, [turmaId]);

        if (detalhesOriginal.length === 0) return res.status(400).json({ message: 'A turma não tem módulos atribuídos.' });

        // Calcular horas restantes para cada módulo
        let modulesData = [];
        for (let m of detalhesOriginal) {
            const [check] = await db.query(`
                SELECT COALESCE(SUM(TIMESTAMPDIFF(SECOND, inicio, fim)) / 3600, 0) as agendado
                FROM horarios_aulas WHERE id_turma_detalhe = ?
            `, [m.id]);

            const horasJaAgendadas = parseFloat(check[0].agendado);
            const horasRestantes = m.horas_planeadas - horasJaAgendadas;

            if (horasRestantes > 0) {
                modulesData.push({
                    ...m,
                    horasRestantes: horasRestantes,
                    originalHorasRestantes: horasRestantes // Para log/debug
                });
            }
        }

        if (modulesData.length === 0) {
            return res.status(400).json({ message: 'Todos os módulos desta turma já estão totalmente agendados.' });
        }

        // Configurações do regime
        const config = regime === 'pos_laboral'
            ? {
                startHour: 16,
                lunchStart: 19,
                lunchEnd: 20,
                endHour: 23,
                dayHours: 6 // 3h + 3h
            }
            : {
                startHour: 8,
                lunchStart: 11,
                lunchEnd: 12,
                endHour: 15,
                dayHours: 6 // 3h antes + 3h depois
            };

        let searchCursor = new Date(dataInicio);
        searchCursor.setHours(0, 0, 0, 0);

        let lessonsCreated = 0;
        let safetyCounter = 0;
        const maxDays = 600;

        // Helper timezone logic
        const getLisbonOffset = (date) => {
            // Retorna 1 se for hora de verão (GMT+1), 0 se for inverno (GMT)
            // Assumindo ambiente UTC
            try {
                const formatted = new Intl.DateTimeFormat('en-US', {
                    timeZone: 'Europe/Lisbon',
                    timeZoneName: 'short'
                }).format(date);
                const isSummer = formatted.includes('GMT+1') || formatted.includes('WEST');
                return isSummer ? 1 : 0;
            } catch (e) {
                console.error(`[TZ] Error:`, e);
                return 0; 
            }
        };

        // Helper para verificar disponibilidade estrita
        const checkAvailability = async (moduleId, start, end, isDiagnostic = false) => {
            const module = modulesData.find(m => m.id === moduleId);
            if (!module) return false;
            if (!module.id_formador || !module.id_sala) return false;

            // Formador Disponível?
            const [trainerAll] = await db.query(`
                SELECT * FROM disponibilidade_formadores 
                WHERE id_formador = ? 
                AND inicio <= ? AND fim >= ?
            `, [module.id_formador, start, end]);

            if (trainerAll.length === 0) {
                if (isDiagnostic) {
                    console.log(`   [Conflict] Modulo ${module.nome_modulo}: Formador ${module.id_formador} sem disponibilidade EXATA para ${start.toISOString()} - ${end.toISOString()}.`);

                    const dayStart = new Date(start); dayStart.setHours(0, 0, 0, 0); // Início do dia
                    const dayEnd = new Date(start); dayEnd.setHours(23, 59, 59, 999); // Fim do dia

                    const [anyAvail] = await db.query(`SELECT inicio, fim FROM disponibilidade_formadores WHERE id_formador = ? AND inicio >= ? AND fim <= ?`, [module.id_formador, dayStart, dayEnd]);
                    if (anyAvail.length > 0) {
                        console.log(`      -> Mas encontrei estas disponibilidades no dia: ${anyAvail.map(a => `${new Date(a.inicio).toISOString().substr(11, 5)}-${new Date(a.fim).toISOString().substr(11, 5)}`).join(', ')}`);
                    } else {
                        console.log(`      -> E NÃO encontrei nenhuma disponibilidade registada neste dia.`);
                    }
                }
                return false;
            }

            // Conflitos (Sala, Formador, Turma)?
            const [conflicts] = await db.query(`
                SELECT h.id, 
                       CASE 
                           WHEN td.id_sala = ? THEN 'Sala'
                           WHEN td.id_formador = ? THEN 'Formador'
                           WHEN td.id_turma = ? THEN 'Turma'
                       END as tipo_conflito
                FROM horarios_aulas h
                JOIN turma_detalhes td ON h.id_turma_detalhe = td.id
                WHERE (
                    td.id_sala = ? 
                    OR td.id_formador = ?
                    OR td.id_turma = ?
                )
                AND ? < h.fim AND ? > h.inicio
            `, [
                module.id_sala, module.id_formador, turmaId, // CASE params 
                module.id_sala, module.id_formador, turmaId, // WHERE params
                start, end
            ]);

            if (conflicts.length > 0) {
                if (isDiagnostic) {
                    const types = [...new Set(conflicts.map(c => c.tipo_conflito))].join(', ');
                    console.log(`   [Conflict] Modulo ${module.nome_modulo}: Conflito de ${types} em ${start.toISOString()}`);
                }
                return false;
            }

            return true;
        };

        // Estratégia: Smart Permutation & 2h Priority & Penalidade de Uso

        let lastDayModuleIds = [];
        let usageCount = {}; // Contagem de uso global para evitar repetição massiva
        let poolSize = 5;

        // Inicializar usageCount
        modulesData.forEach(m => usageCount[m.id] = 0);

        const SAFE_MAX_DAYS = 600;

        // Helper para calcular duração ideal de um módulo para limpar sobras
        const getPreferredDuration = (module) => {
            if (module.horasRestantes < 3) return module.horasRestantes;
            const rem = module.horasRestantes % 3;
            if (rem === 1) return 4;
            if (rem === 2) return 2;
            return 3;
        };

        const calculateSegments = (startTime, durationHours, currentConfig) => {
            let segments = [];
            let remaining = durationHours; 
            let current = new Date(startTime);

            // Todos os limites devem usar a config ajustada
            const lunchStart = new Date(startTime); lunchStart.setHours(currentConfig.lunchStart, 0, 0, 0);
            const lunchEnd = new Date(startTime); lunchEnd.setHours(currentConfig.lunchEnd, 0, 0, 0);
            const dayEnd = new Date(startTime); dayEnd.setHours(currentConfig.endHour, 0, 0, 0);

            while (remaining > 0 && current < dayEnd) {
                if (current >= lunchStart && current < lunchEnd) {
                    current = new Date(lunchEnd);
                    continue;
                }

                let proposedEnd = new Date(current.getTime() + remaining * 3600000);

                // Pula almoço se atravessar
                if (current < lunchStart && proposedEnd > lunchStart) {
                    proposedEnd = new Date(lunchStart);
                }

                if (proposedEnd > dayEnd) proposedEnd = new Date(dayEnd);

                if (proposedEnd <= current) break; // Evita loops se ficar preso

                segments.push({ start: new Date(current), end: new Date(proposedEnd) });
                remaining -= (proposedEnd - current) / 3600000;
                current = new Date(proposedEnd);
            }
            return { segments, nextStartTime: current };
        };

        while (modulesData.some(m => m.horasRestantes > 0) && safetyCounter < SAFE_MAX_DAYS) {

            // Avançar para próximo dia útil
            while (searchCursor.getDay() === 0 || searchCursor.getDay() === 6) {
                searchCursor.setDate(searchCursor.getDate() + 1);
            }

            // Ajuste do fuso horário (DST)
            // Calcular offset para o dia atual
            const offset = getLisbonOffset(searchCursor);
            const dayConfig = { ...config };
            if (offset > 0) {
                // Se é verão (GMT+1), subtraímos 1 hora ao UTC para termos a mesma 'hora local'
                // Ex: 16:00 Local = 15:00 UTC
                dayConfig.startHour -= offset;
                dayConfig.lunchStart -= offset;
                dayConfig.lunchEnd -= offset;
                dayConfig.endHour -= offset;
            }

            // Atualizar a "Pool" de módulos
            let activePool = modulesData.filter(m => m.horasRestantes > 0).slice(0, poolSize);
            if (activePool.length === 0) break;

            // Gerar Candidatos (Pares e Singles)
            let candidates = [];

            for (let i = 0; i < activePool.length; i++) {
                let modA = activePool[i];

                // Opção A: Apenas ModA
                candidates.push({ mod1: modA, mod2: null, score: -5 - (usageCount[modA.id] || 0) });

                // Opção B: Pares ModA + ModB
                for (let j = 0; j < activePool.length; j++) {
                    if (i === j) continue;
                    let modB = activePool[j];

                    let score = 0;
                    if (!lastDayModuleIds.includes(modA.id)) score += 10;
                    if (!lastDayModuleIds.includes(modB.id)) score += 10;
                    score -= (usageCount[modA.id] || 0) * 0.5;
                    score -= (usageCount[modB.id] || 0) * 0.5;
                    if (modA.horasRestantes < 10) score += 5;

                    candidates.push({ mod1: modA, mod2: modB, score });
                }
            }

            candidates.sort((a, b) => {
                if (Math.abs(b.score - a.score) < 1) return Math.random() - 0.5;
                return b.score - a.score;
            });

            let dayScheduled = false;

            // Tentar Candidatos
            for (let cand of candidates) {
                let { mod1, mod2 } = cand;

                let dur1 = getPreferredDuration(mod1);
                if (dur1 > dayConfig.dayHours) dur1 = dayConfig.dayHours;

                let slot1 = dur1;
                let slot2 = dayConfig.dayHours - slot1;

                if (mod2) {
                    if (mod2.horasRestantes < slot2) slot2 = mod2.horasRestantes;
                } else {
                    slot2 = 0;
                    if (mod1.horasRestantes > slot1) {
                        let possible = dayConfig.dayHours;
                        if (mod1.horasRestantes < possible) possible = mod1.horasRestantes;
                        slot1 = possible;
                        slot2 = 0;
                    }
                }

                let attempts = [];
                let try1 = { m1: mod1, s1: slot1, m2: mod2, s2: slot2 };
                if (slot2 > 0 && try1.s1 > try1.s2) {
                    try1 = { m1: mod2, s1: slot2, m2: mod1, s2: slot1 };
                }
                attempts.push(try1);
                if (try1.m1 !== mod1 || try1.s1 !== slot1) {
                    attempts.push({ m1: mod1, s1: slot1, m2: mod2, s2: slot2 });
                }

                for (let attempt of attempts) {
                    let { m1, s1, m2, s2 } = attempt;
                    let blocksAttempt = [];
                    let dayCursor = new Date(searchCursor);
                    // Usar dayConfig.startHour ajustado para o fuso horário local (DST) 
                    dayCursor.setHours(dayConfig.startHour, 0, 0, 0);

                    if (m1 && s1 > 0) {
                        const res = calculateSegments(dayCursor, s1, dayConfig);
                        res.segments.forEach(s => blocksAttempt.push({ mod: m1, start: s.start, end: s.end }));
                        dayCursor = res.nextStartTime;
                    }
                    if (m2 && s2 > 0) {
                        const res = calculateSegments(dayCursor, s2, dayConfig);
                        res.segments.forEach(s => blocksAttempt.push({ mod: m2, start: s.start, end: s.end }));
                    }

                    // Validação
                    let valid = true;
                    for (let b of blocksAttempt) {
                        if (!(await checkAvailability(b.mod.id, b.start, b.end))) {
                            valid = false;
                            break;
                        }
                    }

                    // Se válido, agendar
                    if (valid) {
                        let currentScheduledIds = [];
                        for (let b of blocksAttempt) {
                            await db.query(`INSERT INTO horarios_aulas (id_turma_detalhe, inicio, fim) VALUES (?, ?, ?)`, [b.mod.id, b.start, b.end]);
                            b.mod.horasRestantes -= (b.end - b.start) / 3600000;
                            usageCount[b.mod.id] = (usageCount[b.mod.id] || 0) + 1;
                            if (!currentScheduledIds.includes(b.mod.id)) currentScheduledIds.push(b.mod.id);
                            lessonsCreated++;
                        }
                        let totalHours = blocksAttempt.reduce((acc, b) => acc + (b.end - b.start) / 3600000, 0);
                        console.log(`[AutoSchedule] Dia ${searchCursor.toISOString().split('T')[0]}: ${m1.nome_modulo} (${s1}h) + ${m2?.nome_modulo || '-'} (${s2}h) -> Total ${totalHours}h`);
                        lastDayModuleIds = currentScheduledIds;
                        dayScheduled = true;
                        break;
                    }
                }
                if (dayScheduled) break;
            }

            // Se não foi possível agendar, mostrar candidatos
            if (!dayScheduled) {
                console.log(`[AutoSchedule] FALHA CRÍTICA em ${searchCursor.toISOString().split('T')[0]}.`);
                const topCandidates = candidates.slice(0, 3);
                for (let cand of topCandidates) {
                    const m1 = cand.mod1; const m2 = cand.mod2;
                    const start1 = new Date(searchCursor); start1.setHours(dayConfig.startHour, 0, 0, 0);
                    const end1 = new Date(searchCursor); end1.setHours(dayConfig.startHour + 1, 0, 0, 0);
                    console.log(`   -> Testando Modulo ${m1.nome_modulo}:`);
                    await checkAvailability(m1.id, start1, end1, true);
                    if (m2) {
                        console.log(`   -> Testando Modulo ${m2.nome_modulo}:`);
                        await checkAvailability(m2.id, start1, end1, true);
                    }
                }
            }

            searchCursor.setDate(searchCursor.getDate() + 1);
            safetyCounter++;
        }

        return res.json({
            message: `Processo concluído. ${lessonsCreated} aulas agendadas.`,
            lessonsCreated
        });

    } catch (error) {
        console.error('Erro na nova geração automática:', error);
        return res.status(500).json({ message: 'Erro interno ao gerar horário.' });
    }
};
