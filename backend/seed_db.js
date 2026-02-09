
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env da raiz do projeto (pasta pai)
dotenv.config({ path: path.join(__dirname, '../.env') });

// Configuração do host da BD (permite override via variável de ambiente)
// Se estiver no Docker, usa 'db' (do .env). Se for local, pode-se forçar DB_HOST=localhost ao correr o comando
if (!process.env.DB_HOST) {
    process.env.DB_HOST = 'localhost';
}

async function seedDatabase() {
    try {
        console.log('🔄 A conectar à base de dados (localhost)...');
        const { db } = await import('./src/config/db.js');

        console.log('🧹 A limpar dados antigos...');
        await db.query('SET FOREIGN_KEY_CHECKS = 0');

        // Ordem de limpeza para evitar conflitos (embora FK=0 ajude)
        await db.query('TRUNCATE TABLE horarios_aulas');
        await db.query('TRUNCATE TABLE avaliacoes');
        await db.query('TRUNCATE TABLE inscricoes');
        await db.query('TRUNCATE TABLE turma_detalhes');
        await db.query('TRUNCATE TABLE turmas');
        await db.query('TRUNCATE TABLE curso_modulos');
        await db.query('TRUNCATE TABLE modulos');
        await db.query('TRUNCATE TABLE cursos');
        await db.query('TRUNCATE TABLE formandos');
        await db.query('TRUNCATE TABLE formadores');
        await db.query('TRUNCATE TABLE secretaria');
        await db.query('TRUNCATE TABLE utilizadores');

        await db.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('🧹 Limpeza concluída!');

        console.log('👥 A criar Utilizadores...');
        const saltRounds = 10;
        const defaultFormandoPass = await bcrypt.hash('123456', saltRounds);
        const defaultFormadorPass = await bcrypt.hash('123456', saltRounds);
        const adminPass = await bcrypt.hash('admin123', saltRounds);

        // 1. ADMINS
        const admins = [
            { nome: 'Administrador Geral', email: 'admin@atec.pt', pass: adminPass },
            { nome: 'Vanessa Teles', email: 'vanessa.teles@atec.pt', pass: adminPass },
            { nome: 'Ricardo Evans', email: 'ricardo.evans@atec.pt', pass: adminPass }
        ];

        for (const admin of admins) {
            console.log(`👤 Criando Admin: ${admin.nome}`);
            await db.query(
                `INSERT INTO utilizadores (nome_completo, email, password_hash, is_active, role_id) 
                 VALUES (?, ?, ?, TRUE, (SELECT id FROM roles WHERE nome = 'ADMIN'))`,
                [admin.nome, admin.email, admin.pass]
            );
            // Inserir na tabela secretaria também
            await db.query(
                `INSERT INTO secretaria (utilizador_id, cargo) 
                 VALUES ((SELECT id FROM utilizadores WHERE email = ?), 'Admin')`,
                [admin.email]
            );
        }

        // 2. FORMADORES
        const formadores = [
            { nome: 'Daniel Batista', email: 'daniel.batista@atec.pt' },
            { nome: 'Francisco Terra', email: 'francsico.terra@atec.pt' }, // Typo original mantido :)
            { nome: 'Sandra Santa', email: 'sandra.santa@atec.pt' },
            { nome: 'Pedro Pascoa', email: 'pedro.pascoa@atec.pt' },
            { nome: 'Leonor Carvalho', email: 'leonor.carvalho@atec.pt' }
        ];

        for (const formador of formadores) {
            console.log(`👨‍🏫 Criando Formador: ${formador.nome}`);
            await db.query(
                `INSERT INTO utilizadores (nome_completo, email, password_hash, is_active, role_id) 
                 VALUES (?, ?, ?, TRUE, (SELECT id FROM roles WHERE nome = 'FORMADOR'))`,
                [formador.nome, formador.email, defaultFormadorPass]
            );
            // Inserir perfil
            await db.query(
                `INSERT INTO formadores (utilizador_id, biografia) 
                 VALUES ((SELECT id FROM utilizadores WHERE email = ?), 'Formador experiente da ATEC.')`,
                [formador.email]
            );
        }

        // 3. FORMANDOS
        const formandos = [
            { nome: 'André Pimenta', email: 'andre.pimenta@atec.pt' },
            { nome: 'Angela Costa', email: 'angela.costa@atec.pt' },
            { nome: 'Beatriz Pinho', email: 'beatriz.pinho@atec.pt' },
            { nome: 'Carolina Bastos', email: 'carolina.bastos@atec.pt' },
            { nome: 'Carlos Franco', email: 'carlos.franco@atec.pt' },
            { nome: 'Diana Santos', email: 'diana.santos@atec.pt' },
            { nome: 'Emanuel Rocha', email: 'emanuel.rocha@atec.pt' },
            { nome: 'Fábio Silva', email: 'fabio.silva@atec.pt' },
            { nome: 'Gonçalo Pereira', email: 'goncalo.pereira@atec.pt' },
            { nome: 'Helena Matos', email: 'helena.matos@atec.pt' },
            { nome: 'Inês Ferreira', email: 'ines.ferreira@atec.pt' },
            { nome: 'João Abreu', email: 'joao.abreu@atec.pt' },
            { nome: 'Kevin Dias', email: 'kevin.dias@atec.pt' },
            { nome: 'Laura Gomes', email: 'laura.gomes@atec.pt' },
            { nome: 'Miguel Antunes', email: 'miguel.antunes@atec.pt' },
            { nome: 'Nuno Costa', email: 'nuno.costa@atec.pt' },
            { nome: 'Olívia Sousa', email: 'olivia.sousa@atec.pt' },
            { nome: 'Paulo Jorge', email: 'paulo.jorge@atec.pt' },
            { nome: 'Rita Vale', email: 'rita.vale@atec.pt' },
            { nome: 'Sérgio Ramos', email: 'sergio.ramos@atec.pt' },
            { nome: 'Tiago Mendes', email: 'tiago.mendes@atec.pt' }
        ];

        for (const formando of formandos) {
            console.log(`🎓 Criando Formando: ${formando.nome}`);
            await db.query(
                `INSERT INTO utilizadores (nome_completo, email, password_hash, is_active, role_id) 
                 VALUES (?, ?, ?, TRUE, (SELECT id FROM roles WHERE nome = 'FORMANDO'))`,
                [formando.nome, formando.email, defaultFormandoPass]
            );
            // Inserir perfil
            await db.query(
                `INSERT INTO formandos (utilizador_id, data_nascimento, morada) 
                 VALUES ((SELECT id FROM utilizadores WHERE email = ?), '2000-01-01', 'Portugal')`,
                [formando.email]
            );
        }

        console.log('🎓 A criar Cursos e Módulos...');

        const coursesData = [
            {
                nome: 'Mecatrónica Automóvel de Veículos Elétricos e Híbridos', area: 'MECA 0525',
                modules: [
                    { nome: 'Planear e gerir a atividade oficinal', horas: 50 },
                    { nome: 'Implementar normas de segurança e saúde', horas: 25 },
                    { nome: 'Adotar a legislação laboral no setor automóvel', horas: 50 },
                    { nome: 'Orçamentar intervenções em veículos', horas: 25 },
                    { nome: 'Gerir a carteira de clientes', horas: 50 },
                    { nome: 'Interagir em inglês no setor automóvel', horas: 25 },
                    { nome: 'Efetuar cálculos matemáticos', horas: 50 },
                    { nome: 'Dimensionar peças mecânicas', horas: 50 },
                    { nome: 'Executar operações elementares de mecânica', horas: 50 },
                    { nome: 'Aplicar princípios da cinemática', horas: 50 },
                    { nome: 'Analisar circuitos eletrónicos', horas: 50 },
                    { nome: 'Executar operações em motores CI', horas: 50 },
                    { nome: 'Monitorizar desempenho de motores CI', horas: 50 }
                ]
            },
            {
                nome: 'Cibersegurança', area: 'CISEG 0525',
                modules: [
                    { nome: 'Fundamentos de cibersegurança', horas: 50 },
                    { nome: 'Análise de vulnerabilidades – iniciação', horas: 25 },
                    { nome: 'Análise de vulnerabilidades desenvolvimento', horas: 25 },
                    { nome: 'Introdução à cibersegurança e à ciberdefesa', horas: 50 },
                    { nome: 'Enquadramento operacional da cibersegurança', horas: 50 },
                    { nome: 'Cibersegurança ativa', horas: 50 },
                    { nome: 'Wargamming', horas: 50 }
                ]
            },
            {
                nome: 'Gestão e Controlo de Energia', area: 'GCE 0525',
                modules: [
                    { nome: 'Efetuar cálculos matemáticos', horas: 25 },
                    { nome: 'Aplicar princípios da física', horas: 25 },
                    { nome: 'Aplicar princípios de organização industrial', horas: 25 },
                    { nome: 'Dimensionar condutores e proteções', horas: 50 },
                    { nome: 'Executar circuitos de terra', horas: 50 },
                    { nome: 'Instalar redes de comunicação industriais', horas: 50 },
                    { nome: 'Projetar sistemas de domótica', horas: 50 },
                    { nome: 'Executar a instalação de motores elétricos', horas: 50 },
                    { nome: 'Instalar componentes de gestão técnica', horas: 50 },
                    { nome: 'Implementar sistema de gestão técnica', horas: 50 },
                    { nome: 'Projetar sistemas automatos', horas: 50 },
                    { nome: 'Implementar protocolos de comunicação', horas: 25 }
                ]
            },
            {
                nome: 'Tecnologias e Programação de Sistemas de Informação', area: 'TPSI 0525',
                modules: [
                    { nome: 'Analisar as funções e estrutura da organização', horas: 50 },
                    { nome: 'Analisar e planear sistemas de informação', horas: 50 },
                    { nome: 'Modelar bases de dados relacionais', horas: 50 },
                    { nome: 'Criar a estrutura de uma base de dados SQL', horas: 50 },
                    { nome: 'Programar para a web (frontend)', horas: 50 },
                    { nome: 'Programar para a web (backend)', horas: 50 },
                    { nome: 'Desenvolver algoritmos', horas: 50 },
                    { nome: 'Desenvolver programas em linguagem estruturada', horas: 50 },
                    { nome: 'Desenvolver programas complexos estruturados', horas: 50 },
                    { nome: 'Desenvolver programas orientados a objetos', horas: 50 },
                    { nome: 'Desenvolver de aplicações móveis (Android)', horas: 50 },
                    { nome: 'Criar e integrar bases de dados SQL nas apps', horas: 50 },
                    { nome: 'Configurar redes de comunicação de dados', horas: 25 },
                    { nome: 'Administrar sistemas operativos de rede', horas: 25 },
                    { nome: 'Gerir políticas de segurança', horas: 50 }
                ]
            }
        ];

        for (const curso of coursesData) {
            // Criar Curso
            const [resCurso] = await db.query(
                `INSERT INTO cursos (nome_curso, area, estado) VALUES (?, ?, 'a decorrer')`,
                [curso.nome, curso.area]
            );
            const cursoId = resCurso.insertId;

            // Criar e Associar Módulos
            let sequencia = 1;
            for (const mod of curso.modules) {
                // Insere Módulo (se não existir, ou cria novo)
                const [resMod] = await db.query(
                    `INSERT INTO modulos (nome_modulo, area, carga_horaria) VALUES (?, ?, ?)`,
                    [mod.nome, curso.area, mod.horas]
                );
                const modId = resMod.insertId;

                // Associa ao Curso
                await db.query(
                    `INSERT INTO curso_modulos (id_curso, id_modulo, sequencia, horas_padrao) VALUES (?, ?, ?, ?)`,
                    [cursoId, modId, sequencia++, mod.horas]
                );
            }

            // 4. CRIAR TURMAS (Uma por curso)
            console.log(`🏫 Criando Turma para ${curso.nome}...`);
            const [resTurma] = await db.query(
                `INSERT INTO turmas (id_curso, codigo_turma, data_inicio, data_fim, estado) 
                 VALUES (?, ?, '2025-09-01', '2026-07-30', 'a decorrer')`,
                [cursoId, `T_${curso.area.split(' ')[0]}_2025`]
            );
            const turmaId = resTurma.insertId;

            // Inscrever Formandos
            // TPSI: André e Angela
            if (curso.area.includes('TPSI')) {
                await inscreverFormando(db, 'andre.pimenta@atec.pt', turmaId, cursoId);
                await inscreverFormando(db, 'angela.costa@atec.pt', turmaId, cursoId);

                // Atribuir Formador e Avaliações (apenas no TPSI para teste detalhado)
                await criarAvaliacoesTeste(db, turmaId, cursoId, 'daniel.batista@atec.pt', 'andre.pimenta@atec.pt');
            }
            // MECA: Carlos
            else if (curso.area.includes('MECA')) {
                await inscreverFormando(db, 'carlos.franco@atec.pt', turmaId, cursoId);
            }
            // CISEG: Beatriz
            else if (curso.area.includes('CISEG')) {
                await inscreverFormando(db, 'beatriz.pinho@atec.pt', turmaId, cursoId);
            }
            // GCE: Carolina
            else if (curso.area.includes('GCE')) {
                await inscreverFormando(db, 'carolina.bastos@atec.pt', turmaId, cursoId);
            }
        }

        console.log('✅ Base de dados re-populada com sucesso!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erro no seed:', error);
        process.exit(1);
    }
}

// Helpers
async function inscreverFormando(db, email, turmaId, cursoId) {
    const [user] = await db.query('SELECT id FROM utilizadores WHERE email = ?', [email]);
    if (!user.length) return;
    const [formando] = await db.query('SELECT id FROM formandos WHERE utilizador_id = ?', [user[0].id]);

    await db.query(
        `INSERT INTO inscricoes (id_formando, user_id, id_turma, id_curso, estado, data_inscricao) 
         VALUES (?, ?, ?, ?, 'APROVADO', NOW())`,
        [formando[0].id, user[0].id, turmaId, cursoId]
    );
}

async function criarAvaliacoesTeste(db, turmaId, cursoId, emailFormador, emailFormando) {
    // 1. Obter ID do Formador
    const [uFormador] = await db.query('SELECT id FROM utilizadores WHERE email = ?', [emailFormador]);
    const [formador] = await db.query('SELECT id FROM formadores WHERE utilizador_id = ?', [uFormador[0].id]);
    const formadorId = formador[0].id;

    // 2. Obter ID da Inscrição do Formando (André)
    const [uFormando] = await db.query('SELECT id FROM utilizadores WHERE email = ?', [emailFormando]);
    const [inscricao] = await db.query(
        `SELECT i.id FROM inscricoes i 
         JOIN formandos f ON i.id_formando = f.id 
         WHERE f.utilizador_id = ? AND i.id_turma = ?`,
        [uFormando[0].id, turmaId]
    );
    const inscricaoId = inscricao[0].id;

    // 3. Obter Módulos do Curso
    const [modulos] = await db.query(
        `SELECT m.id, m.nome_modulo FROM modulos m
         JOIN curso_modulos cm ON m.id = cm.id_modulo
         WHERE cm.id_curso = ? ORDER BY cm.sequencia`,
        [cursoId]
    );

    // 4. Criar Detalhes da Turma (Atribuir formador aos módulos)
    // E lançar notas nos primeiros 5 módulos
    let count = 0;
    for (const mod of modulos) {
        // Atribui formador ao módulo na turma
        await db.query(
            `INSERT INTO turma_detalhes (id_turma, id_modulo, id_formador, sequencia, horas_planeadas) 
             VALUES (?, ?, ?, ?, 50)`,
            [turmaId, mod.id, formadorId, ++count]
        );

        // Lança notas para os primeiros 5 módulos (para o André)
        if (count <= 5) {
            const nota = 14 + (count % 5); // Notas variadas: 15, 16, 17, 18, 14
            await db.query(
                `INSERT INTO avaliacoes (id_inscricao, id_modulo, nota, data_avaliacao, observacoes) 
                 VALUES (?, ?, ?, '2025-12-01', 'Bom desempenho.')`,
                [inscricaoId, mod.id, nota]
            );
        }
    }
}

seedDatabase();
