import { Request, Response } from 'express';
import { prisma } from '../config/db';

export const getExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.query;
    const expenses = await prisma.expense.findMany({
      where: userId ? { userId: String(userId) } : undefined,
      orderBy: { expenseDate: 'desc' },
    });
    res.json({ success: true, expenses });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, accountId, amount, category, description, paymentMethod, location, receiptUrl, expenseDate } = req.body;

    const numAmount = parseFloat(amount);

    // Create expense entry
    const expense = await prisma.expense.create({
      data: {
        userId: userId || 'default_user',
        accountId,
        amount: numAmount,
        category,
        description: description || category,
        paymentMethod,
        location,
        receiptUrl,
        expenseDate: expenseDate || new Date().toISOString().split('T')[0],
      },
    });

    // Update account balance
    if (accountId) {
      const acc = await prisma.account.findUnique({ where: { id: accountId } });
      if (acc) {
        await prisma.account.update({
          where: { id: accountId },
          data: { balance: Math.max(0, acc.balance - numAmount) },
        });
      }
    }

    res.json({ success: true, expense });
  } catch (error: any) {
    console.error('Error creating expense:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const exp = await prisma.expense.findUnique({ where: { id } });

    if (exp && exp.accountId) {
      // Revert money to account
      await prisma.account.update({
        where: { id: exp.accountId },
        data: { balance: { increment: exp.amount } },
      });
    }

    await prisma.expense.delete({ where: { id } });
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
