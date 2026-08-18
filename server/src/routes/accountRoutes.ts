import { Router } from 'express';
import { getAccounts, getAccountById, createOrUpdateAccount, updateAccount, deleteAccount } from '../controllers/accountController';

const router = Router();

router.get('/', getAccounts);
router.get('/:id', getAccountById);
router.post('/', createOrUpdateAccount);
router.put('/:id', updateAccount);
router.delete('/:id', deleteAccount);

export default router;
