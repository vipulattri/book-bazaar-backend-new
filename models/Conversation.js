import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema({
  conversationId: { 
    type: String, 
    required: true,
    unique: true,
    index: true 
  },
  bookId: { 
    type: String, 
    required: true,
    index: true 
  },
  sellerId: { 
    type: String, 
    required: true 
  },
  buyerId: { 
    type: String, 
    required: true 
  },
  sellerName: { 
    type: String, 
    required: true 
  },
  buyerName: { 
    type: String, 
    required: true 
  },
  lastMessage: { 
    type: String 
  },
  lastMessageAt: { 
    type: Date 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  unreadCount: {
    seller: { type: Number, default: 0 },
    buyer: { type: Number, default: 0 }
  }
}, { 
  timestamps: true 
});

// Index for efficient querying
ConversationSchema.index({ bookId: 1, sellerId: 1 });
ConversationSchema.index({ sellerId: 1, isActive: 1 });
ConversationSchema.index({ buyerId: 1, isActive: 1 });
ConversationSchema.index({ lastMessageAt: -1 });

export default mongoose.model('Conversation', ConversationSchema);
