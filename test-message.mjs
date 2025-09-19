const testMessage = async () => {
  try {
    console.log('Testing message functionality...');
    
    // Login first to get token and user info
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'testuser@test.com',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      console.log('Login failed');
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    console.log('User ID:', loginData.user.id);
    console.log('Username:', loginData.user.username);
    
    const token = loginData.token;
    const user = loginData.user;

    // Test sending a message
    console.log('\n🔄 Testing message sending...');
    const messagePayload = {
      conversationId: 'test-book-123|user1:user2',
      senderId: user.id,
      senderName: user.username,
      recipientId: 'user2-dummy-id',
      recipientName: 'Test Recipient',
      message: 'Hello! This is a test message from the messaging system.',
      bookId: 'test-book-123'
    };

    console.log('Message payload:', messagePayload);

    const messageResponse = await fetch('http://localhost:5000/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(messagePayload)
    });

    console.log('Response status:', messageResponse.status);
    const messageData = await messageResponse.json();
    
    if (!messageResponse.ok) {
      console.log('❌ Message sending failed');
      console.log('Error details:', messageData);
      return;
    }

    console.log('✅ Message sent successfully!');
    console.log('Response:', messageData);

    // Test fetching messages
    console.log('\n🔄 Testing message retrieval...');
    const fetchResponse = await fetch(`http://localhost:5000/api/messages/${messagePayload.conversationId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (fetchResponse.ok) {
      const messages = await fetchResponse.json();
      console.log('✅ Messages retrieved successfully');
      console.log('Number of messages:', messages.length);
      if (messages.length > 0) {
        console.log('Latest message:', messages[messages.length - 1]);
      }
    } else {
      console.log('❌ Failed to retrieve messages');
      const error = await fetchResponse.json();
      console.log('Error:', error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testMessage();