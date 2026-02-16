import { db } from '../config/db.js';

export const getDashboardStats = async (req, res) => {
    try {
        // Total de cursos terminados
        const [cursosTerminados] = await db.query("SELECT COUNT(*) as count FROM cursos WHERE estado = 'terminado'");

        // Total de cursos a decorrer
        const [cursosADecorrer] = await db.query("SELECT COUNT(*) as count FROM cursos WHERE estado = 'a decorrer'");

        // Total de formandos registados no sistema
        const [formandosAtivos] = await db.query(`
            SELECT COUNT(*) as count 
            FROM utilizadores u
            JOIN roles r ON u.role_id = r.id
            WHERE r.nome = 'FORMANDO'
        `);

        // Nº de cursos por área
        const [cursosPorArea] = await db.query(`
            SELECT area, COUNT(*) as count 
            FROM cursos 
            GROUP BY area
        `);

        // Top 10 de formadores com maior nº de horas lecionadas (baseado no histórico de aulas real)
        const [topFormadores] = await db.query(`
            SELECT 
                u.nome_completo, 
                ROUND(SUM(TIMESTAMPDIFF(MINUTE, h.inicio, h.fim)) / 60, 1) as total_horas
            FROM horarios_aulas h
            JOIN turma_detalhes td ON h.id_turma_detalhe = td.id
            JOIN formadores f ON td.id_formador = f.id
            JOIN utilizadores u ON f.utilizador_id = u.id
            GROUP BY f.id, u.nome_completo
            ORDER BY total_horas DESC
            LIMIT 10
        `);

        res.json({
            stats: {
                cursosTerminados: cursosTerminados[0].count,
                cursosADecorrer: cursosADecorrer[0].count,
                formandosAtivos: formandosAtivos[0].count
            },
            charts: {
                cursosPorArea,
                topFormadores
            }
        });
    } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        res.status(500).json({ message: 'Erro ao carregar dashboard' });
    }
};
