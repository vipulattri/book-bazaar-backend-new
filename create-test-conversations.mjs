// Test script to create sample conversations for testing seller inbox
import mongoose from 'mongoose';
import Message from './models/Message.js';
import Conversation from './models/Conversation.js';
import User from './models/User.js';
import Book from './models/Book.js';
import dotenv from 'dotenv';

dotenv.config();

const createTestData = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/book-bazaar';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing test data
    await Message.deleteMany({ senderName: { $regex: /Test/i } });
    await Conversation.deleteMany({ sellerName: { $regex: /Test/i } });
    console.log('✅ Cleared existing test data');

    // Create test conversations for different scenarios
    const testScenarios = [
      {
        bookId: '60d5f7e1b8f5a1234567890a',
        sellerId: '60d5f7e1b8f5a1234567890b', // This should be the current user's ID
        buyerId: '60d5f7e1b8f5a1234567890c',
        sellerName: 'Test Seller User',
        buyerName: 'Alice Johnson',
        bookTitle: 'Introduction to Computer Science',
        bookPrice: 299,
        lastMessage: 'Hi! Is this book still available? I\'m very interested.',
        messageCount: 3
      },
      {
        bookId: '60d5f7e1b8f5a1234567890d',
        sellerId: '60d5f7e1b8f5a1234567890b',
        buyerId: '60d5f7e1b8f5a1234567890e',
        sellerName: 'Test Seller User',
        buyerName: 'Bob Wilson',
        bookTitle: 'Advanced Mathematics',
        bookPrice: 0, // Free book
        lastMessage: 'Thank you for offering this book for free! When can I pick it up?',
        messageCount: 5
      },
      {
        bookId: '60d5f7e1b8f5a1234567890f',
        sellerId: '60d5f7e1b8f5a1234567890b',
        buyerId: '60d5f7e1b8f5a1234567890g',
        sellerName: 'Test Seller User',
        buyerName: 'Carol Davis',
        bookTitle: 'Physics for Engineers',
        bookPrice: 450,
        lastMessage: 'Could you please share more photos of the book condition?',
        messageCount: 2
      }
    ];

    for (const scenario of testScenarios) {
      const conversationId = `${scenario.bookId}|${[scenario.sellerId, scenario.buyerId].sort().join(':')}`;
      
      // Create conversation
      const conversation = new Conversation({
        conversationId,
        bookId: scenario.bookId,
        sellerId: scenario.sellerId,
        buyerId: scenario.buyerId,
        sellerName: scenario.sellerName,
        buyerName: scenario.buyerName,
        lastMessage: scenario.lastMessage,
        lastMessageAt: new Date(Date.now() - Math.random() * 86400000), // Random time within last 24 hours
        isActive: true,
        unreadCount: {
          seller: Math.floor(Math.random() * 3), // Random unread count for seller
          buyer: 0
        }
      });

      await conversation.save();

      // Create messages for this conversation
      const messages = [
        {
          senderId: scenario.buyerId,
          senderName: scenario.buyerName,
          recipientId: scenario.sellerId,
          recipientName: scenario.sellerName,
          message: 'Hello! I saw your book listing and I\'m interested.',
          time: Date.now() - 120000 // 2 minutes ago
        },
        {
          senderId: scenario.sellerId,
          senderName: scenario.sellerName,
          recipientId: scenario.buyerId,
          recipientName: scenario.buyerName,
          message: 'Hi! Yes, the book is still available. What would you like to know?',
          time: Date.now() - 90000 // 1.5 minutes ago
        },
        {
          senderId: scenario.buyerId,
          senderName: scenario.buyerName,
          recipientId: scenario.sellerId,
          recipientName: scenario.sellerName,
          message: scenario.lastMessage,
          time: Date.now() - 30000 // 30 seconds ago
        }
      ];

      for (let i = 0; i < Math.min(scenario.messageCount, messages.length); i++) {
        const msgData = messages[i];
        const message = new Message({
          conversationId,
          senderId: msgData.senderId,
          senderName: msgData.senderName,
          recipientId: msgData.recipientId,
          recipientName: msgData.recipientName,
          message: msgData.message,
          bookId: scenario.bookId,
          messageType: 'text',
          createdAt: new Date(msgData.time),
          isRead: Math.random() > 0.5 // Random read status
        });

        await message.save();
      }

      console.log(`✅ Created test conversation: ${scenario.bookTitle}`);
    }

    // Create mock book data for the conversations
    const mockBooks = [
      {
        _id: new mongoose.Types.ObjectId('60d5f7e1b8f5a1234567890a'),
        title: 'Introduction to Computer Science',
        author: 'John Smith',
        price: 299,
        image: '/placeholder.svg?height=100&width=75&text=CS',
        userId: '60d5f7e1b8f5a1234567890b'
      },
      {
        _id: new mongoose.Types.ObjectId('60d5f7e1b8f5a1234567890d'),
        title: 'Advanced Mathematics',
        author: 'Jane Doe',
        price: 0,
        image: '/placeholder.svg?height=100&width=75&text=Math',
        userId: '60d5f7e1b8f5a1234567890b'
      },
      {
        _id: new mongoose.Types.ObjectId('60d5f7e1b8f5a1234567890f'),
        title: 'Physics for Engineers',
        author: 'Albert Einstein',
        price: 450,
        image: '/placeholder.svg?height=100&width=75&text=Physics',
        userId: '60d5f7e1b8f5a1234567890b'
      }
    ];

    // Only create books if they don't exist
    for (const bookData of mockBooks) {
      const existingBook = await Book.findById(bookData._id);
      if (!existingBook) {
        const book = new Book(bookData);
        await book.save();
        console.log(`✅ Created mock book: ${bookData.title}`);
      }
    }

    console.log('\n🎉 Test data created successfully!');
    console.log('\nTo test the seller inbox:');
    console.log('1. Login with user ID: 60d5f7e1b8f5a1234567890b');
    console.log('2. Navigate to /inbox');
    console.log('3. You should see 3 conversations with different buyers');
    console.log('4. Each conversation will have unread message indicators');
    console.log('5. Click on any conversation to open the chat');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

createTestData();