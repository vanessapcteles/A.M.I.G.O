import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import passport from './config/passport.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import turmaRoutes from './routes/turmaRoutes.js';
import courseRoutes from './routes/courseRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/turmas', turmaRoutes);
app.use('/api/courses', courseRoutes);

app.listen(3001, () => {
  console.log('Servidor a correr em http://localhost:3001');
});

