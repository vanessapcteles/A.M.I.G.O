import { db } from '../config/db.js';

// Listar módulos de uma turma
export const getTurmaModules = async (req, res) => {
    try {
        const { turmaId } = req.params;
        const [modules] = await db.query(`
            SELECT 
                td.id, 
                td.sequencia, 
                td.horas_planeadas,
                m.id as id_modulo,
                m.nome_modulo,
                u.nome_completo as nome_formador,
                f.id as id_formador,
                s.nome_sala,
                s.id as id_sala,
                (SELECT COALESCE(SUM(TIMESTAMPDIFF(SECOND, h.inicio, h.fim)) / 3600, 0) 
                 FROM horarios_aulas h 
                 WHERE h.id_turma_detalhe = td.id) as horas_agendadas
            FROM turma_detalhes td
            JOIN modulos m ON td.id_modulo = m.id
            JOIN formadores f ON td.id_formador = f.id
            JOIN utilizadores u ON f.utilizador_id = u.id
            JOIN salas s ON td.id_sala = s.id
            WHERE td.id_turma = ?
            ORDER BY td.sequencia ASC
        `, [turmaId]);

        return res.json(modules);
    } catch (error) {
        console.error('Erro ao listar detalhes da turma:', error);
        return res.status(500).json({ message: 'Erro ao listar módulos da turma' });
    }
};

// Listar formandos inscritos na turma
export const getTurmaFormandos = async (req, res) => {
    try {
        const { turmaId } = req.params;
        const [formandos] = await db.query(`
            SELECT 
                f.id,
                u.nome_completo,
                u.email,
                f.telemovel,
                i.data_inscricao,
                i.estado
            FROM inscricoes i
            JOIN formandos f ON i.id_formando = f.id
            JOIN utilizadores u ON f.utilizador_id = u.id
            WHERE i.id_turma = ?
            ORDER BY u.nome_completo ASC
        `, [turmaId]);

        return res.json(formandos);
    } catch (error) {
        console.error('Erro ao listar formandos da turma:', error);
        return res.status(500).json({ message: 'Erro ao listar formandos da turma' });
    }
};

// Adicionar módulo à turma
export const addModuleToTurma = async (req, res) => {
    try {
        const { turmaId } = req.params;
        const { id_modulo, id_formador, id_sala, horas_planeadas, sequencia } = req.body;

        // Validações básicas
        if (!id_modulo || !id_formador || !id_sala || !horas_planeadas) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
        }

        // Verificar duplicação de módulo na turma
        const [existing] = await db.query(
            'SELECT id FROM turma_detalhes WHERE id_turma = ? AND id_modulo = ?',
            [turmaId, id_modulo]
        );
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Este módulo já está associado a esta turma' });
        }

        // Calcular próxima sequência se não enviada
        let nextSequencia = sequencia;
        if (!nextSequencia) {
            const [rows] = await db.query('SELECT MAX(sequencia) as maxSeq FROM turma_detalhes WHERE id_turma = ?', [turmaId]);
            nextSequencia = (rows[0].maxSeq || 0) + 1;
        }

        await db.query(`
            INSERT INTO turma_detalhes (id_turma, id_modulo, id_formador, id_sala, horas_planeadas, sequencia)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [turmaId, id_modulo, id_formador, id_sala, horas_planeadas, nextSequencia]);

        return res.status(201).json({ message: 'Módulo adicionado à turma com sucesso' });
    } catch (error) {
        console.error('Erro ao adicionar módulo:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            if (error.message.includes('id_turma_sequencia')) {
                return res.status(400).json({ message: 'Já existe um módulo com essa sequência.' });
            }
            if (error.message.includes('id_turma, id_modulo')) { // caso o check manual falhe por race condition
                return res.status(400).json({ message: 'Este módulo já está associado a esta turma.' });
            }
        }
        return res.status(500).json({ message: 'Erro ao adicionar módulo: ' + error.message });
    }
};

// Remover módulo da turma
export const removeModuleFromTurma = async (req, res) => {
    try {
        const { detalheId } = req.params;
        await db.query('DELETE FROM turma_detalhes WHERE id = ?', [detalheId]);
        return res.json({ message: 'Módulo removido da turma' });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao remover módulo' });
    }
};
