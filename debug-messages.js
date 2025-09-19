// Debug script to test message functionality
import mongoose from 'mongoose';
import Message from './models/Message.js';
import Conversation from './models/Conversation.js';

const testMessageAPI = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/book-bazaar';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Test creating a simple message
    const testMessage = new Message({
      conversationId: 'test-book|user1:user2',
      senderId: 'user1',
      senderName: 'Test User',
      recipientId: 'user2',
      message: 'Hello, this is a test message',
      bookId: 'test-book',
      messageType: 'text'
    });

    await testMessage.save();
    console.log('✅ Test message created and saved');

    // Test creating a conversation
    const testConversation = new Conversation({
      conversationId: 'test-book|user1:user2',
      bookId: 'test-book',
      sellerId: 'user1',
      buyerId: 'user2',
      sellerName: 'Test Seller',
      buyerName: 'Test Buyer',
      lastMessage: 'Hello, this is a test message',
      lastMessageAt: new Date(),
      isActive: true
    });

    await testConversation.save();
    console.log('✅ Test conversation created and saved');

    // Test fetching
    const messages = await Message.find({ conversationId: 'test-book|user1:user2' });
    console.log('✅ Messages fetched:', messages.length);

    const conversations = await Conversation.find({ conversationId: 'test-book|user1:user2' });
    console.log('✅ Conversations fetched:', conversations.length);

    console.log('\n🎉 All database operations working correctly!');
    console.log('\nNext steps:');
    console.log('1. Make sure your server is running: npm start');
    console.log('2. Check the server logs for any errors');
    console.log('3. Test the API endpoint: POST /api/messages/test');
    console.log('4. Check if authentication is working properly');

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

testMessageAPI();
