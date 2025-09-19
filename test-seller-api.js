// Test script to check seller conversation API
import mongoose from 'mongoose';
import fetch from 'node-fetch';

const testSellerAPI = async () => {
  try {
    console.log('🔍 Testing seller conversation API...');

    // First, login as seller to get token
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'seller@test.com',
        password: 'testpassword123'
      })
    });

    if (!loginResponse.ok) {
      console.error('❌ Failed to login seller');
      return;
    }

    const sellerData = await loginResponse.json();
    console.log('✅ Seller logged in:', sellerData.user.username);
    
    const sellerId = sellerData.user.id;
    const token = sellerData.token;

    // Test the conversations API
    const conversationsResponse = await fetch(`http://localhost:5000/api/messages/conversations/user/${sellerId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!conversationsResponse.ok) {
      console.error('❌ Failed to fetch conversations:', conversationsResponse.status);
      const errorText = await conversationsResponse.text();
      console.error('Error:', errorText);
      return;
    }

    const conversations = await conversationsResponse.json();
    console.log('✅ Conversations API response:');
    console.log('Total conversations:', conversations.length);
    
    conversations.forEach((conv, index) => {
      console.log(`\nConversation ${index + 1}:`);
      console.log('  ID:', conv._id);
      console.log('  ConversationId:', conv.conversationId);
      console.log('  Book ID:', conv.bookId);
      console.log('  Buyer:', conv.buyerName);
      console.log('  Last Message:', conv.lastMessage);
      console.log('  Active:', conv.isActive);
    });

    // Test filtering by specific book
    const bookId = '60d5f7e1b8f5a1234567890a';
    const bookConversations = conversations.filter(conv => 
      conv.bookId === bookId || conv.bookId?._id === bookId
    );
    
    console.log(`\n📚 Conversations for book ${bookId}:`);
    console.log('Count:', bookConversations.length);
    bookConversations.forEach(conv => {
      console.log('  Buyer:', conv.buyerName, '| Message:', conv.lastMessage);
    });

  } catch (error) {
    console.error('❌ Error testing seller API:', error);
  }
};

testSellerAPI();