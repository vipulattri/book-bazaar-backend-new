// Simple in-memory store keyed by conversationId
let conversations = new Map();
// bookId|sellerId -> buyerId
const lastPartnerByBook = new Map();

// GET /api/messages/:conversationId
export const getMessages = (req, res) => {
  const { conversationId } = req.params;
  const msgs = conversations.get(conversationId) || [];
  res.status(200).json(msgs);
};

// GET /api/messages/partner?bookId=...&sellerId=...
export const getLatestPartnerForBook = (req, res) => {
  const { bookId, sellerId } = req.query;
  if (!bookId || !sellerId) {
    return res.status(400).json({ error: 'bookId and sellerId are required' });
  }
  const key = `${bookId}|${sellerId}`;
  const buyerId = lastPartnerByBook.get(key) || null;
  res.status(200).json({ buyerId });
};

// POST /api/messages
export const sendMessage = (req, res) => {
  const { conversationId, senderId, senderName, recipientId, recipientName, message } = req.body;

  if (!conversationId || !senderId || !message) {
    return res.status(400).json({ error: 'conversationId, senderId and message are required' });
  }

  const newMessage = {
    id: Date.now(),
    conversationId,
    senderId,
    senderName,
    recipientId,
    recipientName,
    message,
    timestamp: new Date().toISOString()
  };

  const list = conversations.get(conversationId) || [];
  list.push(newMessage);
  conversations.set(conversationId, list);

  // If this is a book-scoped conversation, remember the latest buyer for the seller
  try {
    if (conversationId.includes('|')) {
      const [bookId, base] = conversationId.split('|');
      const [a, b] = base.split(':');
      // Heuristic: buyer is the non-seller; when buyer sends, recipient is seller
      if (recipientId) {
        const sellerId = recipientId;
        const buyerId = senderId;
        lastPartnerByBook.set(`${bookId}|${sellerId}`, buyerId);
      }
    }
  } catch {}

  // Emit over socket.io if available
  if (global.io) {
    global.io.to(conversationId).emit('chat:message', newMessage);
    // Also notify the recipient with a lightweight notification payload
    if (recipientId) {
      global.io.to(`user:${recipientId}`).emit('notify:new-message', {
        fromUserId: senderId,
        fromName: senderName,
        conversationId,
        preview: message,
        at: new Date().toISOString()
      });
    }
  }

  res.status(201).json({ message: 'Message sent', data: newMessage });
};
