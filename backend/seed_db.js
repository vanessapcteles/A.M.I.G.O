
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env da raiz do projeto (pasta pai)
dotenv.config({ path: path.join(__dirname, '../.env') });

// Configuração do host da BD
// Configuração do host da BD
if (!process.env.DB_HOST || process.env.DB_HOST === 'db') {
    process.env.DB_HOST = 'localhost';
}

async function seedDatabase() {
    try {
        console.log('🔄 A conectar à base de dados (localhost)...');
        const { db } = await import('./src/config/db.js');

        console.log('🧹 A limpar dados antigos...');
        await db.query('SET FOREIGN_KEY_CHECKS = 0');

        const tables = [
            'horarios_aulas', 'avaliacoes', 'inscricoes', 'turma_detalhes',
            'turmas', 'curso_modulos', 'modulos', 'cursos',
            'formandos', 'formadores', 'secretaria', 'utilizadores', 'salas'
        ];

        // Verificar se tabelas existem antes de truncar (ou assumir que existem pelo schema)
        // O seed original apenas truncava. Vamos manter o padrão.
        // Adicionei 'salas' que não estava no original, mas deve existir pela lógica do controller.

        for (const table of tables) {
            try {
                await db.query(`TRUNCATE TABLE ${table}`);
            } catch (err) {
                console.warn(`⚠️ Aviso ao limpar tabela ${table}: ${err.message}`);
            }
        }

        await db.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('🧹 Limpeza concluída!');

        console.log('👥 A criar Utilizadores...');
        const saltRounds = 10;
        const defaultPass = await bcrypt.hash('123456', saltRounds);
        const adminPass = await bcrypt.hash('admin123', saltRounds);

        // 1. ADMINS
        const admins = [
            { nome: 'Vanessa Teles', email: 'vanessa.teles@atec.pt' },
            { nome: 'Ricardo Evans', email: 'ricardo.evans@atec.pt' },
            { nome: 'Admin', email: 'admin@atec.pt' }
        ];

        for (const admin of admins) {
            console.log(`👤 Criando Admin: ${admin.nome}`);
            await db.query(
                `INSERT INTO utilizadores (nome_completo, email, password_hash, is_active, role_id) 
                 VALUES (?, ?, ?, TRUE, (SELECT id FROM roles WHERE nome = 'ADMIN'))`,
                [admin.nome, admin.email, adminPass]
            );
            await db.query(
                `INSERT INTO secretaria (utilizador_id, cargo) 
                 VALUES ((SELECT id FROM utilizadores WHERE email = ?), 'Admin')`,
                [admin.email]
            );
        }

        // 2. FORMADORES
        const formadores = [
            { nome: 'Daniel Batista', email: 'daniel.batista@atec.pt', area: 'MECA' },
            { nome: 'Francisco Terra', email: 'francsico.terra@atec.pt', area: 'GCE' },
            { nome: 'Sandra Santa', email: 'sandra.santa@atec.pt', area: 'MIM' },
            { nome: 'Pedro Pascoa', email: 'pedro.pascoa@atec.pt', area: 'CISEG' },
            { nome: 'Leonor Carvalho', email: 'leonor.carvalho@atec.pt', area: 'TPSI' }
        ];

        for (const formador of formadores) {
            console.log(`👨‍🏫 Criando Formador: ${formador.nome}`);
            await db.query(
                `INSERT INTO utilizadores (nome_completo, email, password_hash, is_active, role_id) 
                 VALUES (?, ?, ?, TRUE, (SELECT id FROM roles WHERE nome = 'FORMADOR'))`,
                [formador.nome, formador.email, defaultPass]
            );
            await db.query(
                `INSERT INTO formadores (utilizador_id, biografia) 
                 VALUES ((SELECT id FROM utilizadores WHERE email = ?), ?)`,
                [formador.email, `Formador da área ${formador.area}`]
            );
        }

        // 3. FORMANDOS
        const formandos = [
            { nome: 'André Pimenta', email: 'andre.pimenta@atec.pt' },
            { nome: 'Angela Costa', email: 'angela.costa@atec.pt' },
            { nome: 'Beatriz Pinho', email: 'beatriz.pinho@atec.pt' },
            { nome: 'Carolina Bastos', email: 'carolina.bastos@atec.pt' },
            { nome: 'Carlos Franco', email: 'carlos.franco@atec.pt' }
        ];

        for (const formando of formandos) {
            console.log(`🎓 Criando Formando: ${formando.nome}`);
            await db.query(
                `INSERT INTO utilizadores (nome_completo, email, password_hash, is_active, role_id) 
                 VALUES (?, ?, ?, TRUE, (SELECT id FROM roles WHERE nome = 'FORMANDO'))`,
                [formando.nome, formando.email, defaultPass]
            );
            await db.query(
                `INSERT INTO formandos (utilizador_id, data_nascimento, morada) 
                 VALUES ((SELECT id FROM utilizadores WHERE email = ?), '2000-01-01', 'Portugal')`,
                [formando.email]
            );
        }

        // 4. SALAS
        console.log('� A criar Salas...');
        const salas = ['Mecatrónica', 'Cibersegurança', 'Gestão e Controlo', 'Programação', 'Soldadura', 'Industrial'];
        for (const sala of salas) {
            // Verificar se a tabela salas existe ou tentar inserir
            try {
                await db.query('INSERT INTO salas (nome_sala, capacidade, localizacao) VALUES (?, 30, ?)', [sala, 'Edifício A']);
            } catch (err) {
                console.warn(`⚠️ Falha ao criar sala ${sala}: ${err.message}`);
            }
        }

        // 5. CURSOS E MÓDULOS
        console.log('📚 A criar Cursos e Módulos...');
        const coursesData = [
            {
                nome: 'Mecatrónica Automóvel de Veículos Elétricos e Híbridos', area: 'MECA 2025', estado: 'A decorrer',
                modules: [
                    { nome: 'Planear e gerir a atividade oficinal', horas: 50 },
                    { nome: 'Implementar as normas de segurança e saúde no trabalho e ambientais em contexto oficinal', horas: 25 },
                    { nome: 'Adotar a legislação laboral no setor automóvel', horas: 50 },
                    { nome: 'Orçamentar intervenções em veículos automóveis', horas: 25 },
                    { nome: 'Gerir a carteira de clientes em oficinas de automóveis', horas: 50 },
                    { nome: 'Interagir em inglês no setor automóvel', horas: 25 },
                    { nome: 'Efetuar cálculos matemáticos em processos industriais', horas: 50 },
                    { nome: 'Dimensionar peças mecânicas', horas: 50 },
                    { nome: 'Executar operações elementares de mecânica geral', horas: 50 },
                    { nome: 'Aplicar os princípios da cinemática e cinética em veículos', horas: 50 },
                    { nome: 'Analisar o funcionamento de circuitos eletrónicos de automóvel', horas: 50 },
                    { nome: 'Executar operações em motores de combustão interna', horas: 50 },
                    { nome: 'Monitorizar o desempenho de motores de combustão interna e seus sistemas', horas: 50 }
                ]
            },
            {
                nome: 'Cibersegurança', area: 'CISEG 2025', estado: 'A decorrer',
                modules: [
                    { nome: 'Fundamentos de cibersegurança', horas: 50 },
                    { nome: 'Análise de vulnerabilidades – iniciação', horas: 25 },
                    { nome: 'Análise de vulnerabilidades  desenvolvimento', horas: 25 },
                    { nome: 'Introdução à cibersegurança e à ciberdefesa', horas: 50 },
                    { nome: 'Enquadramento operacional da cibersegurança', horas: 50 },
                    { nome: 'Cibersegurança ativa', horas: 50 },
                    { nome: 'Wargamming', horas: 50 }
                ]
            },
            {
                nome: 'Gestão e Controlo de Energia', area: 'GCE 2025', estado: 'A decorrer',
                modules: [
                    { nome: 'Efetuar cálculos matemáticos em projetos de sistemas tecnológicos', horas: 25 },
                    { nome: 'Aplicar princípios da física a sistemas técnicos', horas: 25 },
                    { nome: 'Aplicar princípios de organização industrial e da empresa', horas: 25 },
                    { nome: 'Dimensionar condutores, proteções e circuitos de instalações de energia elétrica', horas: 50 },
                    { nome: 'Executar circuitos de terra e de proteção contra descargas atmosféricas', horas: 50 },
                    { nome: 'Instalar e interligar redes de comunicação industriais', horas: 50 },
                    { nome: 'Projetar, instalar e programar sistemas de dom ótica', horas: 50 },
                    { nome: 'Executar a instalação de motores elétricos', horas: 50 },
                    { nome: 'Instalar componentes de sistemas de gestão técnica', horas: 50 },
                    { nome: 'Implementar um sistema de gestão técnica de edifícios', horas: 50 },
                    { nome: 'Projetar sistemas baseados em autómatos programáveis e variadores de velocidade', horas: 50 },
                    { nome: 'Implementar protocolos de comunicação em sistemas de gestão de baterias', horas: 25 }
                ]
            },
            {
                nome: 'Tecnologias e Programação de Sistemas de Informação', area: 'TPSI 2025', estado: 'A decorrer',
                modules: [
                    { nome: 'Analisar as funções e estrutura da organização', horas: 50 },
                    { nome: 'Analisar e planear sistemas de informação', horas: 50 },
                    { nome: 'Modelar bases de dados relacionais', horas: 50 },
                    { nome: 'Criar a estrutura de uma base de dados e programar em SQL', horas: 50 },
                    { nome: 'Programar para a web, na vertente frontend (cliente-side)', horas: 50 },
                    { nome: 'Programar para a web, na vertente servidor (server-side)', horas: 50 },
                    { nome: 'Desenvolver algoritmos', horas: 50 },
                    { nome: 'Desenvolver programas em linguagem estruturada', horas: 50 },
                    { nome: 'Desenvolver programas complexos em linguagem estruturada', horas: 50 },
                    { nome: 'Desenvolver programas em linguagem orientada a objetos', horas: 50 },
                    { nome: 'Desenvolver de aplicações móveis (plataforma Android)', horas: 50 },
                    { nome: 'Criar e integrar bases de dados no SQL nas apps', horas: 50 },
                    { nome: 'Configurar redes de comunicação de dados', horas: 25 },
                    { nome: 'Administrar sistemas operativos de rede', horas: 25 },
                    { nome: 'Gerir políticas de segurança em sistemas informáticos', horas: 50 }
                ]
            },
            {
                nome: 'Técnico/a de Manutenção Industrial/Mecatrónica', area: 'MIM 2025', estado: 'Terminada',
                modules: [
                    { nome: 'Organizar e executar trabalhos de manutenção de equipamentos industriais, de acordo com o plano de manutenção.', horas: 25 },
                    { nome: 'Planear a sequência e os métodos de trabalho de desmontagem e montagem de componentes e equipamentos industriais, recorrendo a desenhos, normas e outras especificações técnicas.', horas: 50 },
                    { nome: 'Definir a aplicação dos processos, materiais e ferramentas adequados à execução dos trabalhos, de acordo com o diagnóstico efetuado.', horas: 50 },
                    { nome: 'Acompanhar e executar as operações de reparação e manutenção de conjuntos mecânicos e de circuitos eletromecânicos e de automação.', horas: 50 },
                    { nome: 'Controlar as reparações e manutenções executadas, utilizando os instrumentos adequados.', horas: 25 },
                    { nome: 'Acompanhar e executar a instalação, preparação e ensaio de vários tipos de máquinas, motores e outros equipamentos industriais.', horas: 50 },
                    { nome: 'Elaborar relatórios e preencher documentação técnica relativa a trabalho desenvolvido.', horas: 25 }
                ]
            },
            {
                nome: 'Técnico/a de Soldadura', area: 'SOL 2026', estado: 'Planeado',
                modules: [
                    { nome: 'Desenho Técnico', horas: 50 },
                    { nome: 'Metrologia dimensional', horas: 50 },
                    { nome: 'Tecnologia da soldadura', horas: 25 },
                    { nome: 'Soldadura MAG/FF em aço carbono e aço inoxidável', horas: 50 },
                    { nome: 'Soldadura SER em aço carbono', horas: 50 },
                    { nome: 'Soldadura TIG em aço carbono', horas: 50 },
                    { nome: 'Maquinação convencional', horas: 25 },
                    { nome: 'Tecnologia dos materiais', horas: 25 }
                ]
            }
        ];

        for (const curso of coursesData) {
            // Criar Curso
            const [resCurso] = await db.query(
                `INSERT INTO cursos (nome_curso, area, estado) VALUES (?, ?, ?)`,
                [curso.nome, curso.area, curso.estado === 'Terminada' ? 'terminado' : curso.estado.toLowerCase()]
            );
            const cursoId = resCurso.insertId;

            // Criar e Associar Módulos
            let sequencia = 1;
            for (const mod of curso.modules) {
                const [resMod] = await db.query(
                    `INSERT INTO modulos (nome_modulo, area, carga_horaria) VALUES (?, ?, ?)`,
                    [mod.nome.substring(0, 150), curso.area, mod.horas]
                );
                const modId = resMod.insertId;

                try {
                    await db.query(
                        `INSERT INTO curso_modulos (id_curso, id_modulo, sequencia, horas_padrao) VALUES (?, ?, ?, ?)`,
                        [cursoId, modId, sequencia++, mod.horas]
                    );
                } catch (err) {
                    console.warn(`Warn: Módulo ${mod.nome} provavelmente já associado. Erro: ${err.message}`);
                }
            }

            // CRIAR TURMA (Uma por curso)
            console.log(`🏫 Criando Turma para ${curso.nome}...`);
            const turmaCode = `T_${curso.area.split(' ')[0]}_${curso.area.split(' ')[1]}`;

            // Mapear estado para o da turma (supondo campos compatíveis ou strings livres)
            let estadoTurma = 'a decorrer';
            if (curso.estado === 'Terminada') estadoTurma = 'terminado';
            else if (curso.estado === 'Planeado') estadoTurma = 'planeado';

            // Datas fictícias baseadas no ano
            const yearStr = curso.area.split(' ')[1]; // 2025, 2026
            const startYear = parseInt(yearStr);
            const dataInicio = `${startYear}-09-01`;
            const dataFim = `${startYear + 1}-07-30`;

            const [resTurma] = await db.query(
                `INSERT INTO turmas (id_curso, codigo_turma, data_inicio, data_fim, estado) 
                 VALUES (?, ?, ?, ?, ?)`,
                [cursoId, turmaCode, dataInicio, dataFim, estadoTurma]
            );
            const turmaId = resTurma.insertId;

            // Atribuir Formador aos Módulos (Turma Detalhes) se houver formador para esta área
            const areaKeyword = curso.area.split(' ')[0]; // MECA, CISEG, GCE, TPSI, MIM, SOL
            const formador = formadores.find(f => f.area === areaKeyword);

            if (formador) {
                // Buscar ID do formador
                const [uFormador] = await db.query('SELECT id FROM utilizadores WHERE email = ?', [formador.email]);
                if (uFormador.length > 0) {
                    const [fRecord] = await db.query('SELECT id FROM formadores WHERE utilizador_id = ?', [uFormador[0].id]);
                    const formadorId = fRecord[0].id;

                    // Buscar módulos do curso
                    const [modulos] = await db.query(
                        `SELECT m.id FROM modulos m
                         JOIN curso_modulos cm ON m.id = cm.id_modulo
                         WHERE cm.id_curso = ? ORDER BY cm.sequencia`,
                        [cursoId]
                    );

                    let seq = 1;
                    for (const m of modulos) {
                        try {
                            await db.query(
                                `INSERT INTO turma_detalhes (id_turma, id_modulo, id_formador, sequencia, horas_planeadas) 
                                 VALUES (?, ?, ?, ?, ?)`,
                                [turmaId, m.id, formadorId, seq++, 50] // Default 50h planeadas
                            );
                        } catch (err) {
                            console.error(`Erro ao criar turma_detalhes: ${err.message}`);
                        }
                    }
                }
            } else {
                console.log(`⚠️ Nenhum formador atribuído automaticamente para ${curso.area} (pode ser intencional se for 'SOL' ou outra área sem formador definido)`);
            }
        }

        console.log('✅ Base de dados re-populada com sucesso!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erro no seed:', error);
        process.exit(1);
    }
}

seedDatabase();
