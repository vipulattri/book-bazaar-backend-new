import express from 'express';
import { 
  getMessages, 
  sendMessage, 
  getLatestPartnerForBook,
  getUserConversations,
  markAsRead,
  getUnreadCount,
  healthCheck
} from '../controllers/messageController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Health check (no auth required)
router.get('/health', healthCheck);

// Message routes
router.post('/', protect, sendMessage);
router.get('/:conversationId', protect, getMessages);
router.put('/:conversationId/read', protect, markAsRead);

// Conversation routes
router.get('/conversations/user/:userId', protect, getUserConversations);
router.get('/unread/:userId', protect, getUnreadCount);

// Partner lookup
router.get('/partner', protect, getLatestPartnerForBook);

export default router;
