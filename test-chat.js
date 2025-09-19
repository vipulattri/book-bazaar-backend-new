// Simple test script to verify chat functionality
import mongoose from 'mongoose';
import Message from './models/Message.js';
import Conversation from './models/Conversation.js';

const testChatFunctionality = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/book-bazaar');
    console.log('Connected to MongoDB');

    // Test creating a conversation
    const testConversation = new Conversation({
      conversationId: 'test-book|user1:user2',
      bookId: 'test-book',
      sellerId: 'user1',
      buyerId: 'user2',
      sellerName: 'Test Seller',
      buyerName: 'Test Buyer',
      lastMessage: 'Hello, is this book still available?',
      lastMessageAt: new Date(),
      isActive: true,
      unreadCount: {
        seller: 0,
        buyer: 1
      }
    });

    await testConversation.save();
    console.log('✅ Test conversation created');

    // Test creating a message
    const testMessage = new Message({
      conversationId: 'test-book|user1:user2',
      senderId: 'user2',
      senderName: 'Test Buyer',
      recipientId: 'user1',
      recipientName: 'Test Seller',
      message: 'Hello, is this book still available?',
      bookId: 'test-book',
      messageType: 'text'
    });

    await testMessage.save();
    console.log('✅ Test message created');

    // Test fetching messages
    const messages = await Message.find({ conversationId: 'test-book|user1:user2' });
    console.log('✅ Messages fetched:', messages.length);

    // Test fetching conversations
    const conversations = await Conversation.find({ sellerId: 'user1' });
    console.log('✅ Conversations fetched:', conversations.length);

    console.log('\n🎉 All chat functionality tests passed!');
    console.log('\nAvailable API endpoints:');
    console.log('- POST /api/messages - Send a message');
    console.log('- GET /api/messages/:conversationId - Get messages for a conversation');
    console.log('- GET /api/messages/conversations/user/:userId - Get user conversations');
    console.log('- GET /api/messages/unread/:userId - Get unread message count');
    console.log('- PUT /api/messages/:conversationId/read - Mark messages as read');
    console.log('- GET /api/messages/partner - Get latest chat partner for a book');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testChatFunctionality();
}

export default testChatFunctionality;
