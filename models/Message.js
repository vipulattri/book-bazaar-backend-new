import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: String,
  conversationId: String
}, { timestamps: true });

export default mongoose.model('Message', MessageSchema);