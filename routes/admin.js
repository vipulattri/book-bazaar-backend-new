import express from 'express';
import { deleteInappropriateListing, getAnalytics } from '../controllers/adminController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/roleMiddleware.js';
const router = express.Router();

router.get('/analytics', protect, isAdmin, getAnalytics);
router.delete('/delete/:id', protect, isAdmin, deleteInappropriateListing);

export default router;