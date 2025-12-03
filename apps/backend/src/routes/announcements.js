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

// Get all announcements
router.get('/', async (req, res) => {
  try {
    const db = await getDB();
    const announcements = db.announcements.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    res.json(announcements);
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Post a new announcement (protected route)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, content, type, date, location } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const db = await getDB();
    const newId = db.announcements.length > 0
      ? Math.max(...db.announcements.map(a => a.id)) + 1
      : 1;

    const announcement = {
      id: newId,
      title,
      content,
      type: type || 'general',
      date: date || new Date().toLocaleDateString(),
      location: location || 'Barangay',
      createdAt: new Date().toISOString()
    };

    db.announcements.push(announcement);
    
    // Notify all residents
    db.users.forEach(user => {
      if (user.role === 'resident' && user.active) {
        const notification = {
          id: db.notifications.length > 0
            ? Math.max(...db.notifications.map(n => n.id)) + 1
            : 1,
          type: 'announcement',
          title: title,
          message: content,
          residentUsername: user.username,
          timestamp: new Date().toISOString(),
          read: false
        };
        db.notifications.push(notification);
      }
    });
    
    const { saveDB } = require('../utils/db');
    await saveDB(db);

    res.json({ message: 'Announcement posted successfully', announcement });
  } catch (error) {
    console.error('Post announcement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

