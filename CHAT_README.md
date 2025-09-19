# Chat Functionality Backend Implementation

## Overview
This implementation provides a complete chat system for the book marketplace, allowing buyers and sellers to communicate about specific books.

## Features Implemented

### 1. Database Models

#### Message Model (`models/Message.js`)
- **conversationId**: Unique identifier for the conversation
- **senderId/senderName**: Who sent the message
- **recipientId/recipientName**: Who receives the message
- **message**: The actual message content
- **bookId**: Reference to the book being discussed
- **isRead**: Read status for the message
- **messageType**: Type of message (text, image, file)
- **timestamps**: Created and updated timestamps

#### Conversation Model (`models/Conversation.js`)
- **conversationId**: Unique identifier for the conversation
- **bookId**: Reference to the book
- **sellerId/buyerId**: Participants in the conversation
- **sellerName/buyerName**: Display names
- **lastMessage/lastMessageAt**: Latest message info
- **isActive**: Whether conversation is still active
- **unreadCount**: Unread message counts for each participant

### 2. API Endpoints

#### Message Endpoints
- `POST /api/messages` - Send a new message
- `GET /api/messages/:conversationId` - Get messages for a conversation
- `PUT /api/messages/:conversationId/read` - Mark messages as read

#### Conversation Endpoints
- `GET /api/messages/conversations/user/:userId` - Get user's conversations
- `GET /api/messages/unread/:userId` - Get unread message count
- `GET /api/messages/partner` - Get latest chat partner for a book

### 3. Socket.IO Events

#### Client to Server
- `chat:join` - Join a conversation room
- `chat:leave` - Leave a conversation room
- `chat:message` - Send a message (also via API)
- `chat:typing` - Send typing indicator
- `user:online` - Mark user as online
- `user:offline` - Mark user as offline

#### Server to Client
- `chat:joined` - Confirmation of joining conversation
- `chat:left` - Confirmation of leaving conversation
- `chat:message` - New message received
- `chat:typing` - Other user is typing
- `notify:new-message` - Notification for new message
- `user:status` - User online/offline status

### 4. Key Features

#### Real-time Messaging
- Messages are sent via REST API and broadcast via Socket.IO
- Automatic conversation creation when first message is sent
- Proper user identification and message attribution

#### Typing Indicators
- Real-time typing indicators
- Automatic timeout after 1 second of inactivity
- Visual feedback for users

#### Message Persistence
- All messages stored in MongoDB
- Pagination support for large conversations
- Automatic read status management

#### Notification System
- Real-time notifications for new messages
- Unread message counts per conversation
- User-specific notification rooms

#### Conversation Management
- Automatic seller/buyer identification
- Book-specific conversations
- Conversation history and metadata

## Usage Examples

### Frontend Integration
```javascript
// Join a conversation
socket.emit('chat:join', { conversationId: 'book123|user1:user2' });

// Send a message
socket.emit('chat:message', {
  conversationId: 'book123|user1:user2',
  message: 'Hello, is this book available?',
  senderId: 'user1',
  senderName: 'John Doe'
});

// Send typing indicator
socket.emit('chat:typing', {
  conversationId: 'book123|user1:user2',
  userId: 'user1',
  isTyping: true
});
```

### API Usage
```javascript
// Send message via API
const response = await fetch('/api/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    conversationId: 'book123|user1:user2',
    senderId: 'user1',
    senderName: 'John Doe',
    recipientId: 'user2',
    message: 'Hello!',
    bookId: 'book123'
  })
});

// Get messages
const messages = await fetch('/api/messages/book123|user1:user2', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## Testing

Run the test script to verify functionality:
```bash
node server/test-chat.js
```

## Security Features

- All endpoints require authentication
- User can only access their own conversations
- Proper input validation and sanitization
- Rate limiting (can be added)

## Performance Optimizations

- Database indexes on frequently queried fields
- Pagination for large message lists
- Efficient conversation lookup
- Socket room management

## Future Enhancements

- File/image sharing
- Message reactions
- Message search
- Conversation archiving
- Push notifications
- Message encryption
