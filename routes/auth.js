import express from 'express';
import passport from 'passport';
import { register, login, googleAuth, googleCallback, checkAuth } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, checkAuth);

// Google OAuth (invoke explicitly to avoid edge cases)
router.get('/google', (req, res, next) => googleAuth(req, res, next));
router.get('/google/callback', googleCallback);

export default router;
