# Chat Error Troubleshooting Guide

## Current Issue: "Internal Server Error" when sending messages

### Step 1: Check Server Logs
1. Start your server: `npm start` or `node server.js`
2. Look for any error messages in the console
3. Check if MongoDB connection is successful

### Step 2: Test Database Connection
Run the debug script:
```bash
node server/debug-messages.js
```

This will test:
- MongoDB connection
- Message model creation
- Conversation model creation
- Database operations

### Step 3: Test API Endpoints

#### Test Health Check (No Auth Required)
```bash
curl https://book-bazaar-backend-new-1.onrender.com/api/messages/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "messageCount": 0,
  "conversationCount": 0,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Test Message Endpoint (No Auth Required)
```bash
curl -X POST https://book-bazaar-backend-new-1.onrender.com/api/messages/test \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Step 4: Check Authentication
1. Verify you have a valid JWT token in localStorage
2. Check if the token is being sent in the Authorization header
3. Test with a simple authenticated request

### Step 5: Common Issues and Solutions

#### Issue 1: MongoDB Connection Error
**Symptoms:** Server crashes on startup
**Solution:** 
- Check if MongoDB is running
- Verify MONGO_URI environment variable
- Try: `mongodb://localhost:27017/book-bazaar`

#### Issue 2: Authentication Error
**Symptoms:** 401 Unauthorized
**Solution:**
- Check JWT_SECRET environment variable
- Verify token format in localStorage
- Ensure token is not expired

#### Issue 3: Model Validation Error
**Symptoms:** 400 Bad Request with validation details
**Solution:**
- Check required fields are provided
- Verify data types match schema
- Check for missing or invalid ObjectIds

#### Issue 4: Database Operation Error
**Symptoms:** 500 Internal Server Error
**Solution:**
- Check MongoDB connection status
- Verify database permissions
- Check for missing indexes

### Step 6: Debug Steps

1. **Enable Detailed Logging**
   - Check server console for detailed error messages
   - Look for stack traces
   - Check request/response data

2. **Test with Simple Data**
   ```javascript
   // Test with minimal data
   {
     "conversationId": "test|user1:user2",
     "senderId": "user1",
     "senderName": "Test User",
     "message": "Hello"
   }
   ```

3. **Check Environment Variables**
   ```bash
   echo $MONGO_URI
   echo $JWT_SECRET
   ```

4. **Verify Database State**
   - Check if collections exist
   - Verify indexes are created
   - Check for any data corruption

### Step 7: Frontend Debugging

1. **Check Browser Console**
   - Look for JavaScript errors
   - Check network requests
   - Verify request payload

2. **Test API Directly**
   - Use browser dev tools Network tab
   - Check request headers
   - Verify response data

3. **Check Authentication State**
   ```javascript
   console.log('Token:', localStorage.getItem('token'));
   console.log('User:', localStorage.getItem('user'));
   ```

### Step 8: Quick Fixes

1. **Restart Server**
   ```bash
   # Kill existing process
   pkill -f "node server.js"
   # Start fresh
   npm start
   ```

2. **Clear Browser Cache**
   - Hard refresh (Ctrl+Shift+R)
   - Clear localStorage
   - Check for cached responses

3. **Reset Database** (Development Only)
   ```bash
   # Connect to MongoDB
   mongo
   # Drop database
   use book-bazaar
   db.dropDatabase()
   ```

### Step 9: Production Considerations

1. **Environment Variables**
   - Set MONGO_URI properly
   - Use strong JWT_SECRET
   - Configure CORS correctly

2. **Database Performance**
   - Add proper indexes
   - Monitor connection pool
   - Check query performance

3. **Error Handling**
   - Implement proper error responses
   - Add request validation
   - Monitor error rates

### Step 10: Get Help

If issues persist:
1. Check server logs for specific error messages
2. Run the debug script and share output
3. Test the health check endpoint
4. Verify all environment variables are set
5. Check MongoDB connection and permissions

## Expected Behavior

When working correctly:
1. Server starts without errors
2. MongoDB connects successfully
3. Health check returns "ok" status
4. Messages can be sent and received
5. Conversations are created automatically
6. Socket.IO events work properly
