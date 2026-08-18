import { Router } from 'express';
import { getRecurring, getRecurringById, createRecurring, updateRecurring, deleteRecurring } from '../controllers/recurringController';

const router = Router();

router.get('/', getRecurring);
router.get('/:id', getRecurringById);
router.post('/', createRecurring);
router.put('/:id', updateRecurring);
router.delete('/:id', deleteRecurring);

export default router;
