import { Router } from 'express';
import { getBills, getBillById, createBill, updateBill, deleteBill } from '../controllers/billController';

const router = Router();

router.get('/', getBills);
router.get('/:id', getBillById);
router.post('/', createBill);
router.put('/:id', updateBill);
router.delete('/:id', deleteBill);

export default router;
