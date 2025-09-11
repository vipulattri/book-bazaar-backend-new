import User from '../models/User.js';
import Book from '../models/Book.js';

export const getAnalytics = async (req, res) => {
  const users = await User.countDocuments();
  const listings = await Book.countDocuments();
  res.json({ users, listings });
};

export const deleteInappropriateListing = async (req, res) => {
  await Book.findByIdAndDelete(req.params.id);
  res.json({ message: 'Listing removed by admin' });
};