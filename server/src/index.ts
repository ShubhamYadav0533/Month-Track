import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import apiRouter from './routes/api';

// Load env from server/.env if run from workspace root
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRouter);

app.get('/', (req, res) => {
  res.json({
    name: 'Smart Daily Money Calculator API Server',
    status: 'Running',
    database: 'Supabase / PostgreSQL',
    documentation: '/api/health',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Smart Daily Money Calculator Backend listening on http://localhost:${PORT}`);
});
