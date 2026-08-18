import { Router } from 'express';
import { getGoals, getGoalById, createGoal, updateGoal, deleteGoal } from '../controllers/goalController';

const router = Router();

router.get('/', getGoals);
router.get('/:id', getGoalById);
router.post('/', createGoal);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);

export default router;
