const testLogin = async () => {
  try {
    console.log('Testing API connection...');
    
    // First check if the server is running
    const healthResponse = await fetch('http://localhost:5000/api/messages/health');
    const healthData = await healthResponse.json();
    console.log('Health check:', healthData);
    
    // Test registration first
    console.log('\nTesting user registration...');
    const registerResponse = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser',
        email: 'testuser@test.com',
        password: 'password123',
        role: 'user',
        class: 'A',
        college: 'Test College'
      })
    });

    if (!registerResponse.ok) {
      const registerError = await registerResponse.json();
      console.log('Registration failed or user exists:', registerError);
    } else {
      const registerData = await registerResponse.json();
      console.log('Registration successful:', registerData);
    }

    // Test login
    console.log('\nTesting user login...');
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
      const loginError = await loginResponse.json();
      console.log('Login failed:', loginError);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('Login successful:', loginData);
    return loginData;

  } catch (error) {
    console.error('Test failed:', error.message);
  }
};

testLogin().then(result => {
  if (result) {
    console.log('\n✅ Authentication is working!');
    console.log('Token:', result.token);
    console.log('User ID:', result.user.id);
  }
});