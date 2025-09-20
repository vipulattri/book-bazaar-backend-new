import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Test Cloudinary configuration
const testCloudinaryConfig = async () => {
  const { cloud_name, api_key, api_secret } = cloudinary.config();
  
  if (!cloud_name) {
    console.error('❌ CLOUDINARY_CLOUD_NAME is missing');
    return false;
  }
  if (!api_key) {
    console.error('❌ CLOUDINARY_API_KEY is missing');
    return false;
  }
  if (!api_secret) {
    console.error('❌ CLOUDINARY_API_SECRET is missing');
    return false;
  }
  
  console.log('✅ Cloudinary configured successfully');
  console.log(`📁 Cloud name: ${cloud_name}`);
  
  // Test API connection
  try {
    await cloudinary.api.ping();
    console.log('✅ Cloudinary API connection successful');
    return true;
  } catch (error) {
    console.error('❌ Cloudinary API connection failed:');
    console.error('Error:', error.error?.message || error.message);
    console.error('HTTP Code:', error.error?.http_code);
    
    if (error.error?.http_code === 401) {
      console.error('');
      console.error('🔑 AUTHENTICATION ERROR: Invalid Cloudinary credentials');
      console.error('Please check your Cloudinary dashboard at: https://cloudinary.com/console');
      console.error('Get your correct credentials from: Account Details > API Keys');
      console.error('');
    }
    
    return false;
  }
};

// Test configuration on startup (but don't block server start)
testCloudinaryConfig().catch(error => {
  console.error('Cloudinary configuration test failed:', error.message);
});

export default cloudinary;
