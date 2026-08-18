import { Router } from 'express';
import { setupUser, getUserProfile } from '../controllers/userController';
import { getExpenses, createExpense, deleteExpense, deleteMultipleExpenses } from '../controllers/expenseController';
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

// Expenses & Transactions Routes
router.get('/expenses', getExpenses);
router.post('/expenses', createExpense);
router.post('/expenses/delete-batch', deleteMultipleExpenses);
router.delete('/expenses/:id', deleteExpense);

// Tasks Routes
router.get('/tasks', async (req, res) => {
  try {
    const { data: tasks, error } = await supabase.from('tasks').select('*');
    if (error) throw error;
    res.json({ success: true, tasks });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/tasks', async (req, res) => {
  try {
    const { userId, title, description, dueDate, priority, section, completed, reminderDate } = req.body;
    const { data: task, error } = await supabase
      .from('tasks')
      .upsert({
        user_id: userId,
        title,
        description: description || null,
        due_date: dueDate || new Date().toISOString().split('T')[0],
        priority: priority || 'Medium',
        section: section || 'Today',
        completed: completed || false,
        reminder_date: reminderDate || null,
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, task });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Bills Routes
router.get('/bills', async (req, res) => {
  try {
    const { data: bills, error } = await supabase.from('bills').select('*');
    if (error) throw error;
    res.json({ success: true, bills });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/bills', async (req, res) => {
  try {
    const { userId, title, amount, dueDate, recurring, status } = req.body;
    const { data: bill, error } = await supabase
      .from('bills')
      .upsert({
        user_id: userId,
        title,
        amount: parseFloat(amount),
        due_date: dueDate || new Date().toISOString().split('T')[0],
        recurring: recurring || false,
        status: status || 'Pending',
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, bill });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

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
        icon: icon || 'target',
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

router.post('/recurring', async (req, res) => {
  try {
    const { userId, title, amount, category, frequency, nextDueDate, autoDeduct } = req.body;
    const { data: item, error } = await supabase
      .from('recurring_transactions')
      .insert({
        user_id: userId,
        title,
        amount: parseFloat(amount),
        category: category || 'Bills',
        frequency: frequency || 'monthly',
        next_due_date: nextDueDate || new Date().toISOString().split('T')[0],
        auto_deduct: autoDeduct ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, recurring: item });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
