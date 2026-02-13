import 'dotenv/config';
import mysql from 'mysql2/promise';


console.log('DB Config:', { host: process.env.DB_HOST, user: process.env.DB_USER });
// Configuração da conexão com a base de dados
export const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});


