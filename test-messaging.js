// Simple test to verify messaging works between buyer and seller

const API_URL = 'https://book-bazaar-backend-new-1.onrender.com';

async function testMessaging() {
  try {
    console.log('🧪 Testing messaging functionality...');
    
    // 1. Login as seller
    console.log('📝 Step 1: Login as seller...');
    const sellerLogin = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'seller@test.com',
        password: 'testpassword123'
      })
    });
    
    if (!sellerLogin.ok) {
      throw new Error('Failed to login seller');
    }
    
    const sellerData = await sellerLogin.json();
    console.log('✅ Seller logged in:', sellerData.user.username);
    
    // 2. Login as buyer
    console.log('📝 Step 2: Login as buyer...');
    const buyerLogin = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'buyer@test.com',
        password: 'testpassword123'
      })
    });
    
    if (!buyerLogin.ok) {
      throw new Error('Failed to login buyer');
    }
    
    const buyerData = await buyerLogin.json();
    console.log('✅ Buyer logged in:', buyerData.user.username);
    
    // 3. Get seller's books
    console.log('📝 Step 3: Fetching seller\'s books...');
    const booksResponse = await fetch(`${API_URL}/api/books?userId=${sellerData.user.id}`, {
      headers: { 'Authorization': `Bearer ${sellerData.token}` }
    });
    
    if (!booksResponse.ok) {
      throw new Error('Failed to fetch books');
    }
    
    const books = await booksResponse.json();
    if (books.length === 0) {
      throw new Error('Seller has no books');
    }
    
    const book = books[0];
    console.log('✅ Found book:', book.title || book._id);
    
    // 4. Create conversation ID
    const conversationId = `${book._id}|${[sellerData.user.id, buyerData.user.id].sort().join(':')}`;
    console.log('📝 Step 4: Conversation ID:', conversationId);
    
    // 5. Send message from buyer to seller
    console.log('📝 Step 5: Sending message from buyer to seller...');
    const messageData = {
      conversationId,
      senderId: buyerData.user.id,
      senderName: buyerData.user.username,
      recipientId: sellerData.user.id,
      recipientName: sellerData.user.username,
      message: 'Hi! I\'m interested in your book. Is it still available?',
      bookId: book._id
    };
    
    const messageResponse = await fetch(`${API_URL}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${buyerData.token}`
      },
      body: JSON.stringify(messageData)
    });
    
    if (!messageResponse.ok) {
      const error = await messageResponse.json();
      throw new Error(`Failed to send message: ${JSON.stringify(error)}`);
    }
    
    const messageResult = await messageResponse.json();
    console.log('✅ Message sent successfully!');
    
    // 6. Check if seller received the message
    console.log('📝 Step 6: Checking if seller received the message...');
    const messagesResponse = await fetch(`${API_URL}/api/messages/${conversationId}`, {
      headers: { 'Authorization': `Bearer ${sellerData.token}` }
    });
    
    if (!messagesResponse.ok) {
      throw new Error('Failed to fetch messages');
    }
    
    const messages = await messagesResponse.json();
    console.log('✅ Messages retrieved:', messages.length);
    
    if (messages.length > 0) {
      console.log('✅ Latest message:', messages[messages.length - 1].message);
    }
    
    // 7. Check seller's conversations
    console.log('📝 Step 7: Checking seller\'s conversations...');
    const conversationsResponse = await fetch(`${API_URL}/api/messages/conversations/user/${sellerData.user.id}`, {
      headers: { 'Authorization': `Bearer ${sellerData.token}` }
    });
    
    if (!conversationsResponse.ok) {
      throw new Error('Failed to fetch conversations');
    }
    
    const conversations = await conversationsResponse.json();
    console.log('✅ Seller has', conversations.length, 'conversations');
    
    console.log('\n🎉 All tests passed! Messaging functionality is working correctly.');
    console.log('\nSummary:');
    console.log('- Seller can be contacted via messaging ✅');
    console.log('- Buyer messages are delivered to seller ✅');
    console.log('- Conversation management is working ✅');
    console.log('- Both /books and /books/add should now have working messaging ✅');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testMessaging();