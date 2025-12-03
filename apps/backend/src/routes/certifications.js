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

// Get all certifications for the logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = await getDB();
    const userCertifications = db.certifications.filter(
      c => c.submittedBy === req.user.username
    );
    res.json(userCertifications);
  } catch (error) {
    console.error('Get certifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit a certification request
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { fullName, birthDate, address, certificateType, purpose } = req.body;

    if (!fullName || !certificateType || !purpose) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const db = await getDB();
    const newId = db.certifications.length > 0
      ? Math.max(...db.certifications.map(c => c.id)) + 1
      : 1;

    const certification = {
      id: newId,
      name: fullName,
      type: certificateType,
      purpose,
      status: 'Pending',
      submittedBy: req.user.username,
      submittedAt: new Date().toISOString(),
      birthDate,
      address
    };

    db.certifications.push(certification);
    
    // Add notification
    const notification = {
      id: db.notifications.length > 0
        ? Math.max(...db.notifications.map(n => n.id)) + 1
        : 1,
      type: 'certificate',
      title: 'Certificate Request Submitted',
      message: `Your ${certificateType} request has been submitted successfully.`,
      residentUsername: req.user.username,
      timestamp: new Date().toISOString(),
      read: false
    };
    db.notifications.push(notification);
    
    await saveDB(db);

    res.json({ message: 'Certification request submitted successfully', certification });
  } catch (error) {
    console.error('Submit certification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

