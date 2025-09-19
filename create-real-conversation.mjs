import fetch from 'node-fetch';

const createRealConversation = async () => {
  try {
    console.log('Creating a real buyer account...');
    
    // Create a buyer account
    const buyerRegister = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Test Buyer',
        email: 'buyer@test.com',
        password: 'testpassword123',
        role: 'user',
        class: 'Engineering',
        college: 'Test University'
      })
    });

    let buyerData;
    if (buyerRegister.ok) {
      buyerData = await buyerRegister.json();
      console.log('✅ Buyer account created');
    } else {
      // Try to login if account already exists
      const buyerLogin = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'buyer@test.com',
          password: 'testpassword123'
        })
      });
      
      if (buyerLogin.ok) {
        buyerData = await buyerLogin.json();
        console.log('✅ Buyer logged in');
      } else {
        throw new Error('Failed to create or login buyer');
      }
    }

    // Login as seller to get their info
    const sellerLogin = await fetch('http://localhost:5000/api/auth/login', {
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
    console.log('✅ Seller logged in');

    // Get seller's books to find a real book ID
    const booksResponse = await fetch(`http://localhost:5000/api/books?userId=${sellerData.user.id}`, {
      headers: { 'Authorization': `Bearer ${sellerData.token}` }
    });

    if (!booksResponse.ok) {
      throw new Error('Failed to fetch seller books');
    }

    const books = await booksResponse.json();
    if (books.length === 0) {
      throw new Error('Seller has no books');
    }

    const book = books[0];
    console.log('✅ Found seller book:', book.title || book._id);

    // Create conversation ID
    const conversationId = `${book._id}|${[sellerData.user.id, buyerData.user.id].sort().join(':')}`;

    // Send a message from buyer to seller
    const messageData = {
      conversationId,
      senderId: buyerData.user.id,
      senderName: buyerData.user.username,
      recipientId: sellerData.user.id,
      recipientName: sellerData.user.username,
      message: 'Hi! I\'m interested in your book. Is it still available?',
      bookId: book._id
    };

    console.log('Sending message:', messageData);

    const messageResponse = await fetch('http://localhost:5000/api/messages', {
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

    console.log('\\n🎉 Real conversation created!');
    console.log('\\nTest accounts:');
    console.log('Seller: seller@test.com / testpassword123');
    console.log('Buyer: buyer@test.com / testpassword123');
    console.log('\\nThe seller should now see the buyer\'s message!');
    console.log('Book ID:', book._id);
    console.log('Conversation ID:', conversationId);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

createRealConversation();