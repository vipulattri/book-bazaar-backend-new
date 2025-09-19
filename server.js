import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from './models/User.js';

// Route imports
import authRoutes from './routes/auth.js';
import bookRoutes from './routes/book.js';
import messageRoutes from './routes/message.js';
import wishlistRoutes from './routes/wishlist.js';
import adminRoutes from './routes/admin.js';

// Initialize app
dotenv.config();
const app = express();
connectDB();

// Middleware
// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.CORS_ORIGIN, 'https://your-frontend-domain.vercel.app']
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(passport.initialize());

// Passport Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : undefined
    const username = profile.displayName || (profile.name ? `${profile.name.givenName} ${profile.name.familyName}` : 'User')

    let user = await User.findOne({ email })
    if (!user) {
      user = await User.create({
        username,
        email,
        password: 'oauth-google',
        role: 'user'
      })
    }
    return done(null, user)
  } catch (err) {
    return done(err)
  }
}))

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Book Marketplace API',
    status: 'Running',
    version: '1.0.0'
  });
});

// Create HTTP server
const server = http.createServer(app);

// Socket.IO setup with production CORS
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.CORS_ORIGIN, 'https://your-frontend-domain.vercel.app']
      : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
    methods: ["GET", "POST"]
  }
});
global.io = io;

// Store for both room-based and peer-to-peer connections
const rooms = {};
const videoChatUsers = new Map(); // For 1-on-1 video chat
const waitingQueue = []; // Queue for users waiting for video chat partners

// Socket.IO logic
io.on('connection', (socket) => {
  console.log('New connection:', socket.id);

  // Join a personal room for user-targeted notifications if userId is provided
  const userId = socket.handshake?.query?.userId;
  if (typeof userId === 'string' && userId) {
    const room = `user:${userId}`;
    socket.join(room);
    console.log(`Socket ${socket.id} joined personal room ${room}`);
  }
  // ========= Enhanced buyer-seller chat rooms =========
  socket.on('chat:join', ({ conversationId }) => {
    if (!conversationId) return;
    socket.join(conversationId);
    socket.emit('chat:joined', { conversationId });
    console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
  });

  socket.on('chat:leave', ({ conversationId }) => {
    if (!conversationId) return;
    socket.leave(conversationId);
    socket.emit('chat:left', { conversationId });
    console.log(`Socket ${socket.id} left conversation ${conversationId}`);
  });

  socket.on('chat:typing', ({ conversationId, userId, isTyping }) => {
    if (!conversationId || !userId) return;
    socket.to(conversationId).emit('chat:typing', { userId, isTyping });
  });

  socket.on('chat:message', ({ conversationId, message, senderId, senderName }) => {
    if (!conversationId || !message) return;
    const payload = {
      id: Date.now(),
      conversationId,
      senderId,
      senderName,
      message,
      timestamp: new Date().toISOString()
    };
    io.to(conversationId).emit('chat:message', payload);
  });

  // Handle online status
  socket.on('user:online', ({ userId }) => {
    if (userId) {
      socket.join(`user:${userId}`);
      socket.broadcast.emit('user:status', { userId, status: 'online' });
    }
  });

  socket.on('user:offline', ({ userId }) => {
    if (userId) {
      socket.leave(`user:${userId}`);
      socket.broadcast.emit('user:status', { userId, status: 'offline' });
    }
  });

  // ===============================
  // EXISTING ROOM-BASED CHAT LOGIC
  // ===============================
  
  socket.on('create-room', (data) => {
    const { roomId, userName, favoriteBook } = data;
    
    rooms[roomId] = {
      id: roomId,
      users: [{ id: socket.id, name: userName }],
      favoriteBook
    };
    
    socket.join(roomId);
    socket.emit('room-created', { roomId });
    io.to(roomId).emit('room-joined', { users: rooms[roomId].users });
  });

  socket.on('join-room', (data) => {
    const { roomId, userName, favoriteBook } = data;
    
    if (rooms[roomId]) {
      rooms[roomId].users.push({ id: socket.id, name: userName });
      socket.join(roomId);
      socket.emit('room-joined', { users: rooms[roomId].users });
      socket.to(roomId).emit('user-joined', { id: socket.id, name: userName });
    } else {
      socket.emit('room-not-found');
    }
  });

  socket.on('message', (data) => {
    socket.to(data.roomId).emit('message', {
      user: data.user,
      text: data.text,
      isEmoji: data.isEmoji
    });
  });

  // Room-based WebRTC signaling
  socket.on('offer', (data) => {
    if (data.roomId) {
      socket.to(data.roomId).emit('offer', data.offer);
    }
  });

  socket.on('answer', (data) => {
    if (data.roomId) {
      socket.to(data.roomId).emit('answer', data.answer);
    }
  });

  socket.on('ice-candidate', (data) => {
    if (data.roomId) {
      socket.to(data.roomId).emit('ice-candidate', data.candidate);
    }
  });

  // ===============================
  // NEW 1-ON-1 VIDEO CHAT LOGIC
  // ===============================

  // Register user for 1-on-1 video chat
  socket.on('register', ({ name }) => {
    console.log(`User registered for video chat: ${name} (${socket.id})`);
    
    // Store user info
    videoChatUsers.set(socket.id, {
      id: socket.id,
      name: name,
      partnerId: null,
      isInVideoChat: true
    });

    // Try to find a partner immediately
    findVideoChatPartner(socket);
  });

  // Find partner for video chat
  function findVideoChatPartner(socket) {
    const currentUser = videoChatUsers.get(socket.id);
    if (!currentUser) return;

    // Find someone waiting who doesn't have a partner and is not the current user
    const availableUser = Array.from(videoChatUsers.values()).find(user => 
      user.id !== socket.id && 
      user.partnerId === null &&
      user.isInVideoChat === true
    );

    if (availableUser) {
      // Match them together
      currentUser.partnerId = availableUser.id;
      availableUser.partnerId = socket.id;
      videoChatUsers.set(socket.id, currentUser);
      videoChatUsers.set(availableUser.id, availableUser);

      console.log(`Video chat matched: ${currentUser.name} with ${availableUser.name}`);

      // Notify both users - first user creates offer, second waits for offer
      socket.emit('peer-joined', { 
        peerId: availableUser.id, 
        peerName: availableUser.name 
      });
      
      io.to(availableUser.id).emit('peer-ready', { 
        peerId: socket.id, 
        peerName: currentUser.name 
      });
    } else {
      // No partner available, user waits
      console.log(`${currentUser.name} is waiting for a video chat partner`);
      socket.emit('waiting-for-peer');
    }
  }

  // Handle video chat offer
  socket.on('offer', ({ offer }) => {
    const user = videoChatUsers.get(socket.id);
    if (user && user.partnerId && user.isInVideoChat) {
      console.log(`Forwarding video chat offer from ${user.name} to partner`);
      io.to(user.partnerId).emit('offer-received', {
        offer: offer,
        from: socket.id
      });
    }
  });

  // Handle video chat answer
  socket.on('answer', ({ answer, to }) => {
    const user = videoChatUsers.get(socket.id);
    if (user && user.isInVideoChat && to) {
      console.log(`Forwarding video chat answer to ${to}`);
      io.to(to).emit('answer-received', { answer });
    }
  });

  // Handle video chat ICE candidates
  socket.on('ice-candidate', ({ candidate }) => {
    const user = videoChatUsers.get(socket.id);
    if (user && user.partnerId && user.isInVideoChat) {
      console.log(`Forwarding ICE candidate from ${user.name} to partner`);
      io.to(user.partnerId).emit('ice-candidate-received', { candidate });
    }
  });

  // Handle video chat messages
  socket.on('chat-message', (message) => {
    const user = videoChatUsers.get(socket.id);
    if (user && user.partnerId && user.isInVideoChat) {
      console.log(`Forwarding chat message from ${user.name} to partner`);
      io.to(user.partnerId).emit('chat-message', message);
    }
  });

  // Handle request to find new video chat peer
  socket.on('find-peer', () => {
    console.log(`User ${socket.id} looking for new video chat partner`);
    const user = videoChatUsers.get(socket.id);
    if (user) {
      user.partnerId = null;
      videoChatUsers.set(socket.id, user);
      findVideoChatPartner(socket);
    }
  });

  // ===============================
  // DISCONNECT HANDLING
  // ===============================

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Handle room-based chat cleanup
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const userIndex = room.users.findIndex(u => u.id === socket.id);
      
      if (userIndex !== -1) {
        const [user] = room.users.splice(userIndex, 1);
        socket.to(roomId).emit('user-left', user.id);
        
        if (room.users.length === 0) {
          delete rooms[roomId];
        }
      }
    }

    // Handle video chat cleanup
    const videoChatUser = videoChatUsers.get(socket.id);
    if (videoChatUser) {
      console.log(`Cleaning up video chat for user: ${videoChatUser.name}`);
      
      // Notify partner if they had one
      if (videoChatUser.partnerId) {
        const partner = videoChatUsers.get(videoChatUser.partnerId);
        if (partner) {
          partner.partnerId = null;
          videoChatUsers.set(videoChatUser.partnerId, partner);
          console.log(`Notifying partner ${partner.name} of disconnection`);
          io.to(videoChatUser.partnerId).emit('peer-disconnected');
        }
      }
      
      // Remove user from video chat users
      videoChatUsers.delete(socket.id);
    }

    // Remove from waiting queue if present
    const queueIndex = waitingQueue.findIndex(id => id === socket.id);
    if (queueIndex !== -1) {
      waitingQueue.splice(queueIndex, 1);
    }
  });

  // ===============================
  // DEBUG/STATUS ENDPOINTS
  // ===============================

  socket.on('get-status', () => {
    const roomCount = Object.keys(rooms).length;
    const videoChatCount = videoChatUsers.size;
    const waitingCount = waitingQueue.length;
    
    socket.emit('status', {
      rooms: roomCount,
      videoChats: videoChatCount,
      waiting: waitingCount,
      timestamp: new Date().toISOString()
    });
  });
});

// Add a simple endpoint to check server status
app.get('/status', (req, res) => {
  res.json({
    status: 'Server running',
    rooms: Object.keys(rooms).length,
    videoChatUsers: videoChatUsers.size,
    timestamp: new Date().toISOString()
  });
});

// Test endpoint for messages
app.post('/api/messages/test', (req, res) => {
  console.log('Test message endpoint hit:', req.body);
  res.json({ 
    message: 'Test endpoint working',
    received: req.body,
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Features enabled:');
  console.log('- Room-based chat');
  console.log('- 1-on-1 video chat');
  console.log('- WebRTC signaling');
  console.log(`- Status endpoint: http://localhost:${PORT}/status`);
});