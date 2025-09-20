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
    console.log('📝 Creating new book...');
    console.log('📁 Request body:', req.body);
    console.log('🖼️ File info:', req.file ? { filename: req.file.filename, size: req.file.size } : 'No file');
    
    let imageUrl = '';

    // Upload to Cloudinary if file exists
    if (req.file) {
      try {
        console.log('☁️ Uploading to Cloudinary...');
        
        // Test Cloudinary connection first
        try {
          await cloudinary.api.ping();
        } catch (pingError) {
          throw new Error('Cloudinary credentials are invalid. Please check your configuration.');
        }
        
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'book-marketplace',
          transformation: [
            { width: 500, height: 600, crop: 'limit' },
            { quality: 'auto' },
            { format: 'auto' }
          ]
        });
        
        imageUrl = result.secure_url;
        console.log('✅ Cloudinary upload successful:', imageUrl);

        // Clean up local file
        try {
          fs.unlinkSync(req.file.path);
          console.log('🗑️ Local file cleaned up');
        } catch (cleanupError) {
          console.warn('⚠️ Could not delete local file:', cleanupError.message);
        }
      } catch (cloudinaryError) {
        console.error('❌ Cloudinary upload failed:', cloudinaryError);
        
        // FALLBACK: Use local file path if Cloudinary fails
        if (req.file && req.file.filename) {
          imageUrl = `/uploads/${req.file.filename}`;
          console.log('🔄 Fallback: Using local file path:', imageUrl);
        }
        
        // Log the error but don't fail the request
        console.warn('⚠️ Book will be created with local image path due to Cloudinary error');
      }
    }

    // Extract and validate fields
    const { 
      title, 
      author, 
      genre, 
      price, 
      condition, 
      Address,  // Note: capital A to match frontend
      phone, 
      Subject,  // Note: capital S to match frontend
      description,
      isDonation,
      name,
      email
    } = req.body;

    // Validation: require at least title or author
    if (!title && !author) {
      return res.status(400).json({ 
        message: 'Please provide either a book title or author name' 
      });
    }

    // Validation: require contact information
    if (!Address || !phone) {
      return res.status(400).json({ 
        message: 'Please provide your address and phone number' 
      });
    }

    // Create book object
    const bookData = {
      title: title?.trim() || '',
      author: author?.trim() || '',
      genre: genre || 'General',
      price: isDonation === 'true' ? 0 : (Number(price) || 0),
      condition: condition || 'Good',
      image: imageUrl,
      Address: Address?.trim(),
      phone: phone?.trim(),
      Subject: Subject?.trim() || '',
      description: description?.trim() || '',
      isDonation: isDonation === 'true',
      userId: req.user?.id,
      name: name?.trim() || req.user?.username || '',
      email: email?.trim() || req.user?.email || ''
    };

    console.log('💾 Creating book with data:', bookData);

    const book = await Book.create(bookData);
    
    console.log('✅ Book created successfully:', book._id);
    
    // Populate user info for response
    const populatedBook = await Book.findById(book._id).populate('userId', 'username email');
    
    res.status(201).json({
      message: 'Book created successfully',
      book: populatedBook
    });
    
  } catch (error) {
    console.error('❌ Error in createBook:', error);
    
    // Clean up uploaded file if it exists and creation failed
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup file:', cleanupError);
      }
    }
    
    res.status(500).json({
      message: 'Error creating book',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
