// Simple test script to check if messaging API works
const testMessage = async () => {
  try {
    // Test user login first
    console.log('Testing user login...');
    const loginResponse = await fetch('https://book-bazaar-backend-new-1.onrender.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com', // Change this to a valid test user
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      console.log('Login failed, status:', loginResponse.status);
      const errorData = await loginResponse.json();
      console.log('Login error:', errorData);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('Login successful:', loginData);
    
    const token = loginData.token;
    const user = loginData.user;

    // Test sending a message
    console.log('\nTesting message sending...');
    const messageResponse = await fetch('https://book-bazaar-backend-new-1.onrender.com/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        conversationId: 'test-book|user1:user2',
        senderId: user.id,
        senderName: user.username,
        recipientId: 'user2',
        message: 'Hello, this is a test message!',
        bookId: 'test-book'
      })
    });

    const messageData = await messageResponse.json();
    
    if (!messageResponse.ok) {
      console.log('Message sending failed, status:', messageResponse.status);
      console.log('Message error:', messageData);
      return;
    }

    console.log('Message sent successfully:', messageData);

  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testMessage();
}

export default testMessage;