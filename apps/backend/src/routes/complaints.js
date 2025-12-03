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

// Get all complaints for the logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = await getDB();
    const userComplaints = db.complaints.filter(
      c => c.complainant === req.user.username
    );
    res.json(userComplaints);
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit a complaint
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { category, location, details, complainant, contact } = req.body;

    if (!category || !location || !details) {
      return res.status(400).json({ error: 'Category, location, and details are required' });
    }

    const db = await getDB();
    const newId = db.complaints.length > 0
      ? Math.max(...db.complaints.map(c => c.id)) + 1
      : 1;

    const complaint = {
      id: newId,
      category,
      location,
      details,
      status: 'Open',
      complainant: complainant || req.user.username,
      contact: contact || '',
      submittedAt: new Date().toISOString()
    };

    db.complaints.push(complaint);
    
    // Add notification
    const notification = {
      id: db.notifications.length > 0
        ? Math.max(...db.notifications.map(n => n.id)) + 1
        : 1,
      type: 'complaint',
      title: 'Complaint Submitted',
      message: `Your ${category} complaint has been submitted successfully.`,
      residentUsername: req.user.username,
      timestamp: new Date().toISOString(),
      read: false
    };
    db.notifications.push(notification);
    
    await saveDB(db);

    res.json({ message: 'Complaint submitted successfully', complaint });
  } catch (error) {
    console.error('Submit complaint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

