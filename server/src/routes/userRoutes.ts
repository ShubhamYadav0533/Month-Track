import { Router } from 'express';
import { setupUser, getUserProfile, updateUser } from '../controllers/userController';

const router = Router();

router.post('/setup', setupUser);
router.get('/:userId', getUserProfile);
router.put('/:userId', updateUser);

export default router;
