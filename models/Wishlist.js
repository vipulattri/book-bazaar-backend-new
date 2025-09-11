import mongoose from 'mongoose';

const WishlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  books: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }]
});

export default mongoose.model('Wishlist', WishlistSchema);
