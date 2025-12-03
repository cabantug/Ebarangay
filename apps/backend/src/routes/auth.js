const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Helper function to read/write database
async function getDB() {
  const dbPath = path.join(__dirname, '../data/db.json');
  const data = await fs.readFile(dbPath, 'utf8');
  return JSON.parse(data);
}

async function saveDB(db) {
  const dbPath = path.join(__dirname, '../data/db.json');
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
}

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const db = await getDB();
    const user = db.users.find(u => u.username === username && u.active);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    let passwordMatch = false;
    if (user.password && user.password.startsWith('$2')) {
      passwordMatch = await bcrypt.compare(password, user.password);
    } else if (user.password) {
      passwordMatch = password === user.password;
    } else {
      passwordMatch = password === 'password123';
    }
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register (submit registration request)
router.post('/register', async (req, res) => {
  try {
    const {
      fullName,
      birthDate,
      address,
      phone,
      email,
      purok,
      occupation,
      username,
      password,
      reason
    } = req.body;

    if (!fullName || !username || !password) {
      return res.status(400).json({ error: 'Full name, username, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const db = await getDB();
    
    // Check if username exists
    if (db.users.find(u => u.username === username)) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Create registration request
    const newRequest = {
      id: db.registrationRequests.length + 1,
      fullName,
      birthDate,
      address,
      phone,
      email,
      purok,
      occupation,
      username,
      password,
      reason,
      status: 'Pending',
      submittedAt: new Date().toISOString()
    };

    db.registrationRequests.push(newRequest);
    await saveDB(db);

    res.json({ message: 'Registration request submitted successfully', request: newRequest });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const db = await getDB();
    const user = db.users.find(u => u.username === req.user.username);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const db = await getDB();
    const user = db.users.find(u => u.username === req.user.username);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check current password
    if (currentPassword !== 'password123') { // Simplified for demo
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await saveDB(db);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

