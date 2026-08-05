import { Request, Response } from 'express';
import { prisma } from '../config/db';

export const setupUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, monthlyIncome, salaryDate, savingsGoal, currency, walletBal, bankBal, upiBal, cardLimit } = req.body;

    const userEmail = email || `user_${Date.now()}@smartfinance.app`;

    // Upsert User profile
    const user = await prisma.user.upsert({
      where: { email: userEmail },
      update: {
        name: name || 'User',
        monthlyIncome: parseFloat(monthlyIncome) || 40000,
        salaryDate: parseInt(salaryDate, 10) || 1,
        savingsGoal: parseFloat(savingsGoal) || 10000,
        currency: currency || '₹',
      },
      create: {
        name: name || 'User',
        email: userEmail,
        monthlyIncome: parseFloat(monthlyIncome) || 40000,
        salaryDate: parseInt(salaryDate, 10) || 1,
        savingsGoal: parseFloat(savingsGoal) || 10000,
        currency: currency || '₹',
      },
    });

    // Create default accounts for user
    const defaultAccounts = [
      { userId: user.id, name: 'Wallet Cash', type: 'wallet', balance: parseFloat(walletBal) || 2000 },
      { userId: user.id, name: 'Bank Balance', type: 'bank', balance: parseFloat(bankBal) || 8000 },
      { userId: user.id, name: 'UPI Balance', type: 'upi', balance: parseFloat(upiBal) || 1500 },
      { userId: user.id, name: 'Credit Card', type: 'card', balance: 0, creditLimit: parseFloat(cardLimit) || 50000 },
    ];

    await prisma.account.deleteMany({ where: { userId: user.id } });
    await prisma.account.createMany({ data: defaultAccounts });

    const accounts = await prisma.account.findMany({ where: { userId: user.id } });

    res.json({
      success: true,
      user,
      accounts,
    });
  } catch (error: any) {
    console.error('Error in setupUser:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: true,
        expenses: { take: 20, orderBy: { createdAt: 'desc' } },
        budgets: true,
        savingsGoals: true,
        recurring: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
