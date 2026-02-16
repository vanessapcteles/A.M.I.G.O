import 'dotenv/config'; // A nossa chave mestra! Carrega as variáveis de ambiente do .env
import express from 'express'; // O motor do nosso servidor backend
import cors from 'cors'; // Segurança: permite que o frontend (noutra porta) fale com este backend
import passport from './config/passport.js'; // O nosso porteiro para autenticação

// Importação das Rotas (Caminhos da nossa API)
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import turmaRoutes from './routes/turmaRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import moduleRoutes from './routes/moduleRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import formandoRoutes from './routes/formandoRoutes.js';
import formadorRoutes from './routes/formadorRoutes.js';
import turmaDetalhesRoutes from './routes/turmaDetalhesRoutes.js';
import horarioRoutes from './routes/horarioRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import candidatosRoutes from './routes/candidatosRoutes.js';
import disponibilidadeRoutes from './routes/disponibilidadeRoutes.js';
import evaluationRoutes from './routes/evaluationRoutes.js';

// Inicializar a aplicação Express
const app = express();

// Middlewares Globais (Funções que correm antes de cada pedido)
app.use(cors()); // Aceitar pedidos de qualquer origem (útil para dev, em prod restringimos)
app.use(express.json()); // Ensinar o servidor a ler JSON (porque os dados vêm como texto)
app.use(passport.initialize()); // Ligar o sistema de segurança do Passport

// Definição das Rotas da API
// Cada linha associa um prefixo a um ficheiro de rotas específico
app.use('/api/auth', authRoutes); // Tudo o que é login, registo, logout
app.use('/api/users', userRoutes); // Gestão de utilizadores
app.use('/api/rooms', roomRoutes); // Gestão de salas
app.use('/api/turmas', turmaRoutes); // Gestão de turmas
app.use('/api/courses', courseRoutes); // Cursos
app.use('/api/modules', moduleRoutes); // Módulos
app.use('/api/files', fileRoutes); // Uploads de ficheiros
app.use('/api/formandos', formandoRoutes); // Rotas específicas de formandos
app.use('/api/formadores', formadorRoutes); // Rotas específicas de formadores
app.use('/api/turma-details', turmaDetalhesRoutes); // Detalhes técnicos das turmas
app.use('/api/dashboard', dashboardRoutes); // Dados para os gráficos do dashboard
app.use('/api/schedules', horarioRoutes); // Horários escolares
app.use('/api/candidatos', candidatosRoutes); // Candidaturas externas
app.use('/api/availability', disponibilidadeRoutes); // Disponibilidade de salas/profs
app.use('/api/evaluations', evaluationRoutes); // Notas e avaliações

// Iniciar o Servidor
// Ele fica à escuta na porta 3001
app.listen(3001, () => {
  console.log('🚀 Servidor a correr a todo o vapor em http://localhost:3001');
});

