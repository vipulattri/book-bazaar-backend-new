import Book from '../models/Book.js';
import Book from '../models/Book.js';
import cloudinary from '../utils/cloudinary.js';
import fs from 'fs';

export const getBooks = async (req, res) => {
  try {
    const { 
      userId, 
      search, 
      genre, 
      condition, 
      minPrice, 
      maxPrice, 
      price, 
      sort 
    } = req.query;
    
    // Build filter object
    const filter = {};
    
    // User filter
    if (userId) {
      filter.userId = userId;
    }
    
    // Search filter (title, author, subject)
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { author: searchRegex },
        { Subject: searchRegex },
        { genre: searchRegex }
      ];
    }
    
    // Genre filter
    if (genre && genre !== 'all') {
      filter.genre = genre;
    }
    
    // Condition filter
    if (condition && condition !== 'all') {
      filter.condition = condition;
    }
    
    // Price filters
    if (price === '0') {
      // Show only free books
      filter.price = 0;
    } else {
      // Price range filter
      const priceFilter = {};
      if (minPrice && !isNaN(Number(minPrice))) {
        priceFilter.$gte = Number(minPrice);
      }
      if (maxPrice && !isNaN(Number(maxPrice))) {
        priceFilter.$lte = Number(maxPrice);
      }
      if (Object.keys(priceFilter).length > 0) {
        filter.price = priceFilter;
      }
    }
    
    // Build sort object
    let sortOption = { createdAt: -1 }; // Default: newest first
    
    if (sort) {
      switch (sort) {
        case 'price-low':
          sortOption = { price: 1 };
          break;
        case 'price-high':
          sortOption = { price: -1 };
          break;
        case 'title':
          sortOption = { title: 1 };
          break;
        case 'newest':
        default:
          sortOption = { createdAt: -1 };
          break;
      }
    }
    
    console.log('📊 Filter applied:', filter);
    console.log('📊 Sort applied:', sortOption);
    
    const books = await Book.find(filter)
      .populate('userId', 'username email')
      .sort(sortOption);
    
    console.log(`📚 Found ${books.length} books`);
    res.json(books);
  } catch (error) {
    console.error('❌ Error in getBooks:', error);
    res.status(500).json({ message: 'Error fetching books', error: error.message });
  }
};

export const createBook = async (req, res) => {
  try {
    let imageUrl = '';

    // Upload to Cloudinary if file exists
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'books',
      });
      imageUrl = result.secure_url;

      // Optionally delete the local file to clean up
      fs.unlinkSync(req.file.path);
    }

    // ✅ Destructure all required fields
    const { title, author, genre, price, condition, address, phone, subject } = req.body;

    // Minimal validation: require at least title or author
    if (!title && !author) {
      return res.status(400).json({ message: 'Please provide a title or an author' });
    }

    const book = await Book.create({
      title,
      author,
      genre,
      price: Number(price) || 0,
      condition,
      image: imageUrl,
      address,
      phone,
      subject,
      userId: req.user?.id,
      name: req.user?.username,
      email: req.user?.email
    });

    res.status(201).json(book);
  } catch (error) {
    console.error('❌ Error in createBook:', error);
    res.status(500).json({
      message: 'Error creating book',
      error: error.message,
      stack: error.stack
    });
  }
};

export const updateBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(book);
  } catch (error) {
    res.status(500).json({ message: 'Error updating book', error: error.message });
  }
};

export const searchBooks = async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json([]);
    }
    
    const searchQuery = q.trim();
    const regex = new RegExp(searchQuery, 'i');
    
    const books = await Book.find({
      $or: [
        { title: regex },
        { author: regex },
        { genre: regex },
        { subject: regex }
      ]
    })
    .select('_id title author genre subject price image')
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });
    
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: 'Error searching books', error: error.message });
  }
};

export const deleteBook = async (req, res) => {
  try {
    await Book.findByIdAndDelete(req.params.id);
    res.json({ message: 'Book deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting book', error: error.message });
  }
};
