import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import passport from './config/passport.js';
import authRoutes from './routes/authRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

app.use('/api/auth', authRoutes);

app.listen(3001, () => {
  console.log('Servidor a correr em http://localhost:3001');
});

