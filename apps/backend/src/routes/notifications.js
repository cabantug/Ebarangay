const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

async function getDB() {
  const dbPath = path.join(__dirname, '../data/db.json');
  const data = await fs.readFile(dbPath, 'utf8');
  return JSON.parse(data);
}

async function saveDB(db) {
  const dbPath = path.join(__dirname, '../data/db.json');
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
}

// Get all notifications for the logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = await getDB();
    const userNotifications = db.notifications
      .filter(n => n.residentUsername === req.user.username)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json(userNotifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unread count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const db = await getDB();
    const userNotifications = db.notifications.filter(n => n.residentUsername === req.user.username);
    const unreadCount = userNotifications.filter(n => !n.read).length;
    
    res.json({ count: unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDB();
    
    const notification = db.notifications.find(n => 
      n.id === parseInt(id) && n.residentUsername === req.user.username
    );
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    notification.read = true;
    await saveDB(db);
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

