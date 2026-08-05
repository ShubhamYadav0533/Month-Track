import { Router } from 'express';
import { setupUser, getUserProfile } from '../controllers/userController';
import { getExpenses, createExpense, deleteExpense } from '../controllers/expenseController';
import { prisma } from '../config/db';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// User & Setup Routes
router.post('/user/setup', setupUser);
router.get('/user/:userId', getUserProfile);

// Accounts Routes
router.get('/accounts', async (req, res) => {
  try {
    const accounts = await prisma.account.findMany();
    res.json({ success: true, accounts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Expenses Routes
router.get('/expenses', getExpenses);
router.post('/expenses', createExpense);
router.delete('/expenses/:id', deleteExpense);

// Budgets Routes
router.get('/budgets', async (req, res) => {
  try {
    const budgets = await prisma.budget.findMany();
    res.json({ success: true, budgets });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/budgets', async (req, res) => {
  try {
    const { userId, category, monthlyLimit } = req.body;
    const budget = await prisma.budget.upsert({
      where: { userId_category: { userId: userId || 'default_user', category } },
      update: { monthlyLimit: parseFloat(monthlyLimit) },
      create: { userId: userId || 'default_user', category, monthlyLimit: parseFloat(monthlyLimit) },
    });
    res.json({ success: true, budget });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Savings Goals Routes
router.get('/goals', async (req, res) => {
  try {
    const goals = await prisma.savingsGoal.findMany();
    res.json({ success: true, goals });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/goals', async (req, res) => {
  try {
    const { userId, title, targetAmount, savedAmount, targetDate, icon } = req.body;
    const goal = await prisma.savingsGoal.create({
      data: {
        userId: userId || 'default_user',
        title,
        targetAmount: parseFloat(targetAmount),
        savedAmount: parseFloat(savedAmount) || 0,
        targetDate,
        icon,
      },
    });
    res.json({ success: true, goal });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Recurring Transactions Routes
router.get('/recurring', async (req, res) => {
  try {
    const recurring = await prisma.recurringTransaction.findMany();
    res.json({ success: true, recurring });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
