import { Router } from 'express';
import userRoutes from './userRoutes';
import transactionRoutes from './transactionRoutes';
import accountRoutes from './accountRoutes';
import taskRoutes from './taskRoutes';
import billRoutes from './billRoutes';
import budgetRoutes from './budgetRoutes';
import goalRoutes from './goalRoutes';
import recurringRoutes from './recurringRoutes';

const router = Router();

// ── Health Check ─────────────────────────────────────────────────
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    database: 'Supabase DB',
    serverTime: new Date().toISOString(),
    endpoints: [
      '/api/user', '/api/accounts', '/api/transactions', '/api/expenses',
      '/api/tasks', '/api/bills', '/api/budgets', '/api/goals', '/api/recurring',
    ],
  });
});

// ── Module Routes ────────────────────────────────────────────────
router.use('/user',         userRoutes);
router.use('/accounts',     accountRoutes);
router.use('/transactions', transactionRoutes);
router.use('/expenses',     transactionRoutes);   // backward compatibility alias
router.use('/tasks',        taskRoutes);
router.use('/bills',        billRoutes);
router.use('/budgets',      budgetRoutes);
router.use('/goals',        goalRoutes);
router.use('/recurring',    recurringRoutes);

export default router;
