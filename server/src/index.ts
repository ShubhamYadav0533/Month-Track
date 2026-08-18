import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import apiRouter from './routes/index';
import { errorHandler } from './middleware/errorHandler';

// Load env from server/.env if run from workspace root
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── API Routes ───────────────────────────────────────────────────
app.use('/api', apiRouter);

// ── Root ─────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    name: 'Smart Daily Money Calculator API Server',
    status: 'Running',
    database: 'Supabase / PostgreSQL',
    documentation: '/api/health',
  });
});

// ── Global Error Handler (must be last middleware) ────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Smart Daily Money Calculator Backend listening on http://localhost:${PORT}`);
});
