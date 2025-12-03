const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

async function getDB() {
  const dbPath = path.join(__dirname, '../data/db.json');
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    const db = JSON.parse(data);
    if (!db.messages) {
      db.messages = [];
      await saveDB(db);
    }
    return db;
  } catch (error) {
    // If file doesn't exist, create it
    const db = { messages: [] };
    await saveDB(db);
    return db;
  }
}

async function saveDB(db) {
  const dbPath = path.join(__dirname, '../data/db.json');
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
}

// Get all messages for the logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = await getDB();
    const username = req.user.username;
    
    // Get messages where user is sender or receiver
    const userMessages = db.messages.filter(m => 
      m.from === username || m.to === username
    ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json(userMessages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get messages thread/conversation with a specific user
router.get('/thread/:username', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;
    const db = await getDB();
    const currentUser = req.user.username;
    
    // Get messages between current user and target user
    const threadMessages = db.messages.filter(m => 
      (m.from === currentUser && m.to === username) ||
      (m.from === username && m.to === currentUser)
    ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    res.json(threadMessages);
  } catch (error) {
    console.error('Get thread error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send a message (resident to admin or admin reply)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { to, message } = req.body;
    const from = req.user.username;

    if (!to || !message || !message.trim()) {
      return res.status(400).json({ error: 'Recipient and message are required' });
    }

    const db = await getDB();
    const newId = db.messages.length > 0
      ? Math.max(...db.messages.map(m => m.id || 0)) + 1
      : 1;

    const newMessage = {
      id: newId,
      from,
      to,
      message: message.trim(),
      timestamp: new Date().toISOString(),
      isReply: from === 'Admin',
      read: false
    };

    db.messages.push(newMessage);
    await saveDB(db);

    res.json({ message: 'Message sent successfully', data: newMessage });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reply to a message
router.post('/:id/reply', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const from = req.user.username;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const db = await getDB();
    const originalMessage = db.messages.find(m => m.id === parseInt(id));

    if (!originalMessage) {
      return res.status(404).json({ error: 'Original message not found' });
    }

    const replyId = db.messages.length > 0
      ? Math.max(...db.messages.map(m => m.id || 0)) + 1
      : 1;

    const reply = {
      id: replyId,
      threadId: originalMessage.threadId || originalMessage.id,
      from,
      to: originalMessage.from === from ? originalMessage.to : originalMessage.from,
      message: message.trim(),
      timestamp: new Date().toISOString(),
      isReply: true,
      originalMessageId: parseInt(id),
      read: false
    };

    db.messages.push(reply);
    await saveDB(db);

    res.json({ message: 'Reply sent successfully', data: reply });
  } catch (error) {
    console.error('Reply error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark message as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDB();
    
    const message = db.messages.find(m => 
      m.id === parseInt(id) && m.to === req.user.username
    );
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    message.read = true;
    await saveDB(db);
    
    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unread messages count (for admin)
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const db = await getDB();
    const unreadMessages = db.messages.filter(m => 
      m.to === req.user.username && !m.read
    );
    
    res.json({ count: unreadMessages.length });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

