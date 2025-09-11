import Wishlist from '../models/Wishlist.js';

export const getWishlist = async (req, res) => {
  const wishlist = await Wishlist.findOne({ userId: req.user.id }).populate('books');
  res.json(wishlist);
};

export const addToWishlist = async (req, res) => {
  const { bookId } = req.body;
  const wishlist = await Wishlist.findOneAndUpdate(
    { userId: req.user.id },
    { $addToSet: { books: bookId } },
    { new: true, upsert: true }
  );
  res.json(wishlist);
};

export const removeFromWishlist = async (req, res) => {
  const { bookId } = req.body;
  const wishlist = await Wishlist.findOneAndUpdate(
    { userId: req.user.id },
    { $pull: { books: bookId } },
    { new: true }
  );
  res.json(wishlist);
};
