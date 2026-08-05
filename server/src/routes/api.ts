import { Router } from 'express';
import { setupUser, getUserProfile } from '../controllers/userController';
import { getExpenses, createExpense, deleteExpense } from '../controllers/expenseController';
import { supabase } from '../config/db';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', database: 'Supabase DB', serverTime: new Date().toISOString() });
});

// User & Setup Routes
router.post('/user/setup', setupUser);
router.get('/user/:userId', getUserProfile);

// Accounts Routes
router.get('/accounts', async (req, res) => {
  try {
    const { data: accounts, error } = await supabase.from('accounts').select('*');
    if (error) throw error;
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
    const { data: budgets, error } = await supabase.from('budgets').select('*');
    if (error) throw error;
    res.json({ success: true, budgets });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/budgets', async (req, res) => {
  try {
    const { userId, category, monthlyLimit } = req.body;
    const { data: budget, error } = await supabase
      .from('budgets')
      .upsert({
        user_id: userId,
        category,
        monthly_limit: parseFloat(monthlyLimit),
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, budget });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Savings Goals Routes
router.get('/goals', async (req, res) => {
  try {
    const { data: goals, error } = await supabase.from('savings_goals').select('*');
    if (error) throw error;
    res.json({ success: true, goals });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/goals', async (req, res) => {
  try {
    const { userId, title, targetAmount, savedAmount, targetDate, icon } = req.body;
    const { data: goal, error } = await supabase
      .from('savings_goals')
      .insert({
        user_id: userId,
        title,
        target_amount: parseFloat(targetAmount),
        saved_amount: parseFloat(savedAmount) || 0,
        target_date: targetDate,
        icon,
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, goal });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Recurring Transactions Routes
router.get('/recurring', async (req, res) => {
  try {
    const { data: recurring, error } = await supabase.from('recurring_transactions').select('*');
    if (error) throw error;
    res.json({ success: true, recurring });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
