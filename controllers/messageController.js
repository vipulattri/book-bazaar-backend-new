import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Book from '../models/Book.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// Health check endpoint
export const healthCheck = async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const messageCount = await Message.countDocuments();
    const conversationCount = await Conversation.countDocuments();
    
    res.json({
      status: 'ok',
      database: dbStatus,
      messageCount,
      conversationCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// GET /api/messages/:conversationId
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const skip = (page - 1) * limit;
    
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    // Mark messages as read for the current user
    if (req.user?.id) {
      await Message.updateMany(
        { 
          conversationId, 
          senderId: { $ne: req.user.id },
          isRead: false 
        },
        { isRead: true }
      );
    }
    
    // Transform messages to include timestamp field
    const transformedMessages = messages.map(msg => ({
      id: msg._id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      senderName: msg.senderName,
      recipientId: msg.recipientId,
      recipientName: msg.recipientName,
      message: msg.message,
      bookId: msg.bookId,
      timestamp: msg.createdAt, // Map createdAt to timestamp for frontend compatibility
      isRead: msg.isRead,
      messageType: msg.messageType
    }));
    
    res.status(200).json(transformedMessages.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// GET /api/messages/partner?bookId=...&sellerId=...
export const getLatestPartnerForBook = async (req, res) => {
  try {
    const { bookId, sellerId } = req.query;
    if (!bookId || !sellerId) {
      return res.status(400).json({ error: 'bookId and sellerId are required' });
    }
    
    const conversation = await Conversation.findOne({ 
      bookId, 
      sellerId, 
      isActive: true 
    }).sort({ lastMessageAt: -1 });
    
    res.status(200).json({ 
      buyerId: conversation?.buyerId || null,
      buyerName: conversation?.buyerName || null
    });
  } catch (error) {
    console.error('Error fetching latest partner:', error);
    res.status(500).json({ error: 'Failed to fetch latest partner' });
  }
};

// GET /api/messages/conversations/user/:userId
export const getUserConversations = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (page - 1) * limit;
    
    const conversations = await Conversation.find({
      $or: [{ sellerId: userId }, { buyerId: userId }],
      isActive: true
    })
    .populate('bookId', 'title author image price')
    .sort({ lastMessageAt: -1 })
    .limit(parseInt(limit))
    .skip(skip);
    
    res.status(200).json(conversations);
  } catch (error) {
    console.error('Error fetching user conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

// POST /api/messages
export const sendMessage = async (req, res) => {
  try {
    console.log('Received message request:', req.body);
    console.log('User from auth:', req.user);
    const { conversationId, senderId, senderName, recipientId, recipientName, message, bookId } = req.body;

    // Validate required fields with detailed error messages
    if (!conversationId) {
      console.log('Missing conversationId');
      return res.status(400).json({ error: 'conversationId is required' });
    }
    
    // Validate conversationId format
    if (!conversationId.includes('|') || !conversationId.includes(':')) {
      console.log('Invalid conversationId format:', conversationId);
      return res.status(400).json({ error: 'conversationId must be in format: bookId|userId1:userId2' });
    }
    
    if (!senderId) {
      console.log('Missing senderId');
      return res.status(400).json({ error: 'senderId is required' });
    }
    
    if (!message) {
      console.log('Missing message');
      return res.status(400).json({ error: 'message is required' });
    }

    // Additional validation to ensure senderId matches authenticated user
    if (req.user && req.user.id && senderId !== req.user.id) {
      console.log('SenderId mismatch:', { senderId, authenticatedUserId: req.user.id });
      return res.status(403).json({ error: 'senderId must match authenticated user' });
    }

    // If senderId is not provided, use the authenticated user's ID
    const actualSenderId = senderId || req.user?.id;
    if (!actualSenderId) {
      console.log('No senderId provided and no authenticated user');
      return res.status(400).json({ error: 'Unable to determine sender identity' });
    }

    // Create or update conversation
    let conversation = await Conversation.findOne({ conversationId });
    
    if (!conversation) {
      // Extract bookId and participants from conversationId
      const conversationParts = conversationId.split('|');
      if (conversationParts.length !== 2) {
        console.log('Invalid conversationId format - missing pipe separator:', conversationId);
        return res.status(400).json({ error: 'Invalid conversationId format' });
      }
      
      const [bookIdFromConv, participants] = conversationParts;
      
      if (!participants || !participants.includes(':')) {
        console.log('Invalid participants format in conversationId:', participants);
        return res.status(400).json({ error: 'Invalid participants format in conversationId' });
      }
      
      const participantParts = participants.split(':');
      if (participantParts.length !== 2) {
        console.log('Invalid participant count in conversationId:', participants);
        return res.status(400).json({ error: 'Invalid participant count in conversationId' });
      }
      
      const [userId1, userId2] = participantParts;
      
      if (!bookIdFromConv) {
        console.log('Missing bookId in conversationId:', conversationId);
        return res.status(400).json({ error: 'bookId is required in conversationId' });
      }
      
      // Get user names - handle both ObjectId and string IDs
      let user1, user2;
      try {
        [user1, user2] = await Promise.all([
          User.findById(userId1).catch(() => null),
          User.findById(userId2).catch(() => null)
        ]);
      } catch (error) {
        console.log('Error fetching users, using fallback names');
        user1 = null;
        user2 = null;
      }
      
      // Determine seller and buyer (seller is the one who posted the book)
      let book;
      try {
        book = await Book.findById(bookIdFromConv);
      } catch (error) {
        console.log('Error fetching book, using fallback');
        book = null;
      }
      
      const sellerId = book?.userId?.toString() || userId1;
      const buyerId = sellerId === userId1 ? userId2 : userId1;
      
      conversation = new Conversation({
        conversationId,
        bookId: bookIdFromConv,
        sellerId,
        buyerId,
        sellerName: sellerId === userId1 ? (user1?.username || senderName || 'User') : (user2?.username || recipientName || 'User'),
        buyerName: buyerId === userId1 ? (user1?.username || senderName || 'User') : (user2?.username || recipientName || 'User')
      });
    }

    // Create new message
    const newMessage = new Message({
      conversationId,
      senderId: actualSenderId,
      senderName: senderName || req.user.username,
      recipientId,
      recipientName,
      message,
      bookId: bookId || conversation.bookId,
      messageType: 'text'
    });

    // Update conversation
    conversation.lastMessage = message;
    conversation.lastMessageAt = new Date();
    
    // Update unread count
    if (actualSenderId === conversation.sellerId) {
      conversation.unreadCount.buyer += 1;
    } else {
      conversation.unreadCount.seller += 1;
    }

    console.log('Saving message and conversation...');
    await Promise.all([
      newMessage.save(),
      conversation.save()
    ]);
    console.log('Message and conversation saved successfully');

    // Emit over socket.io if available
    if (global.io) {
      console.log('Emitting socket events...');
      
      // Transform message for socket emission to include timestamp
      const socketMessage = {
        id: newMessage._id,
        conversationId: newMessage.conversationId,
        senderId: newMessage.senderId,
        senderName: newMessage.senderName,
        recipientId: newMessage.recipientId,
        recipientName: newMessage.recipientName,
        message: newMessage.message,
        bookId: newMessage.bookId,
        timestamp: newMessage.createdAt, // Map createdAt to timestamp
        isRead: newMessage.isRead,
        messageType: newMessage.messageType
      };
      
      global.io.to(conversationId).emit('chat:message', socketMessage);
      
      // Notify the recipient
      if (recipientId) {
        global.io.to(`user:${recipientId}`).emit('notify:new-message', {
          fromUserId: actualSenderId,
          fromName: senderName || req.user?.username || 'User',
          conversationId,
          preview: message,
          bookId: conversation.bookId,
          at: new Date().toISOString()
        });
      }
    }

    console.log('Message sent successfully');
    
    // Transform response to include timestamp field
    const responseMessage = {
      id: newMessage._id,
      conversationId: newMessage.conversationId,
      senderId: newMessage.senderId,
      senderName: newMessage.senderName,
      recipientId: newMessage.recipientId,
      recipientName: newMessage.recipientName,
      message: newMessage.message,
      bookId: newMessage.bookId,
      timestamp: newMessage.createdAt, // Map createdAt to timestamp
      isRead: newMessage.isRead,
      messageType: newMessage.messageType
    };
    
    res.status(201).json({ 
      message: 'Message sent', 
      data: responseMessage,
      conversation: conversation
    });
  } catch (error) {
    console.error('Error sending message:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Failed to send message',
      details: error.message 
    });
  }
};

// PUT /api/messages/:conversationId/read
export const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;

    await Message.updateMany(
      { 
        conversationId, 
        senderId: { $ne: userId },
        isRead: false 
      },
      { isRead: true }
    );

    // Reset unread count for the user
    const conversation = await Conversation.findOne({ conversationId });
    if (conversation) {
      if (userId === conversation.sellerId) {
        conversation.unreadCount.seller = 0;
      } else {
        conversation.unreadCount.buyer = 0;
      }
      await conversation.save();
    }

    res.status(200).json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
};

// GET /api/messages/unread/:userId
export const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const conversations = await Conversation.find({
      $or: [{ sellerId: userId }, { buyerId: userId }],
      isActive: true
    });

    let totalUnread = 0;
    conversations.forEach(conv => {
      if (conv.sellerId === userId) {
        totalUnread += conv.unreadCount.seller;
      } else {
        totalUnread += conv.unreadCount.buyer;
      }
    });

    res.status(200).json({ unreadCount: totalUnread });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};
