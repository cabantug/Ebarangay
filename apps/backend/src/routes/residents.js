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

// Get all residents (public directory)
router.get('/', async (req, res) => {
  try {
    const db = await getDB();
    const residents = db.users
      .filter(user => user.role === 'resident' && user.active)
      .map(({ password: _, ...user }) => user);
    
    res.json(residents);
  } catch (error) {
    console.error('Get residents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

