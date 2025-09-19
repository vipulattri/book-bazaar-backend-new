import mongoose from 'mongoose';
import Conversation from './models/Conversation.js';
import Message from './models/Message.js';
import dotenv from 'dotenv';

dotenv.config();

const checkData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/book-bazaar');
    console.log('✅ Connected to MongoDB');
    
    const conversations = await Conversation.find({});
    console.log('Total conversations:', conversations.length);
    
    const messages = await Message.find({});
    console.log('Total messages:', messages.length);
    
    if (conversations.length > 0) {
      console.log('\nFirst conversation:');
      console.log('ID:', conversations[0]._id);
      console.log('ConversationId:', conversations[0].conversationId);
      console.log('BookId:', conversations[0].bookId);
      console.log('SellerId:', conversations[0].sellerId);
      console.log('BuyerId:', conversations[0].buyerId);
      console.log('Last message:', conversations[0].lastMessage);
    }
    
    // Check for specific seller
    const sellerConversations = await Conversation.find({ sellerId: '60d5f7e1b8f5a1234567890b' });
    console.log('\nConversations for test seller:', sellerConversations.length);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

checkData();