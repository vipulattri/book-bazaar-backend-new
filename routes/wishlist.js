import express from 'express';
import { getWishlist, addToWishlist, removeFromWishlist } from '../controllers/wishlistController.js';
import { protect } from '../middlewares/authMiddleware.js';
const router = express.Router();

router.get('/', protect, getWishlist);
router.post('/add', protect, addToWishlist);
router.post('/remove', protect, removeFromWishlist);

export default router;
