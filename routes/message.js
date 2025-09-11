import express from 'express';
import { getMessages, sendMessage, getLatestPartnerForBook } from '../controllers/messageController.js';
import { protect } from '../middlewares/authMiddleware.js';
const router = express.Router();

router.post('/', protect, sendMessage);
router.get('/partner', protect, getLatestPartnerForBook);
router.get('/:conversationId', protect, getMessages);

export default router;
