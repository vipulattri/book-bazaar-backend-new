import express from 'express';
import {
  createBook,
  deleteBook,
  getBooks,
  updateBook,
  searchBooks
} from '../controllers/bookController.js';

import { protect } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/multer.js'; // multer middleware for handling file uploads

const router = express.Router();

// ✅ Public route to fetch all books
router.get('/', getBooks);

// ✅ Public route to search books
router.get('/search', searchBooks);

// ✅ Protected route to create a book with image (using multer)
router.post('/', protect, upload.single('image'), createBook);

// ✅ Protected route to update a book
router.put('/:id', protect, upload.single('image'), updateBook);

// ✅ Protected route to delete a book
router.delete('/:id', protect, deleteBook);

export default router;
