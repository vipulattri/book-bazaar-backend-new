// Create test user for testing seller inbox
import mongoose from 'mongoose';
import User from './models/User.js';
import bcrypt from 'bcryptjs';
import generateToken from './utils/generateToken.js';
import dotenv from 'dotenv';

dotenv.config();

const createTestUser = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/book-bazaar';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Delete existing test user if exists
    await User.deleteOne({ email: 'seller@test.com' });

    // Create test user with the specific ID we used in conversations
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    
    const testUser = new User({
      _id: new mongoose.Types.ObjectId('60d5f7e1b8f5a1234567890b'),
      username: 'Test Seller User',
      email: 'seller@test.com',
      password: hashedPassword,
      role: 'user',
      class: 'Computer Science',
      college: 'Test University'
    });

    await testUser.save();
    console.log('✅ Test user created successfully');

    // Generate token for this user
    const token = generateToken(testUser);
    console.log('✅ Token generated for test user');

    console.log('\n🎉 Test user created successfully!');
    console.log('\nLogin credentials:');
    console.log('Email: seller@test.com');
    console.log('Password: testpassword123');
    console.log('\nUser ID:', testUser._id.toString());
    console.log('Token:', token);
    
    console.log('\nTo test the seller inbox:');
    console.log('1. Login with the credentials above');
    console.log('2. Navigate to /inbox');
    console.log('3. You should see 3 conversations with different buyers');

  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

createTestUser();