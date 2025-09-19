import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  conversationId: { 
    type: String, 
    required: true,
    index: true 
  },
  senderId: { 
    type: String, 
    required: true 
  },
  senderName: { 
    type: String, 
    required: true 
  },
  recipientId: { 
    type: String, 
    required: true 
  },
  recipientName: { 
    type: String 
  },
  message: { 
    type: String, 
    required: true 
  },
  bookId: { 
    type: String,
    index: true
  },
  isRead: { 
    type: Boolean, 
    default: false 
  },
  messageType: { 
    type: String, 
    enum: ['text', 'image', 'file'], 
    default: 'text' 
  }
}, { 
  timestamps: true 
});

// Index for efficient querying
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ bookId: 1, createdAt: -1 });

export default mongoose.model('Message', MessageSchema);