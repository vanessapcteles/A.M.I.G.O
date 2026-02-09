import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import passport from './config/passport.js';
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

const app = express();

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/turmas', turmaRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/formandos', formandoRoutes);
app.use('/api/formadores', formadorRoutes);
app.use('/api/turma-details', turmaDetalhesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/schedules', horarioRoutes);
app.use('/api/candidatos', candidatosRoutes);
app.use('/api/availability', disponibilidadeRoutes);
app.use('/api/evaluations', evaluationRoutes);


app.listen(3001, () => {
  console.log('Servidor a correr em http://localhost:3001');
});

