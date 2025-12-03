const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const dbPath = path.join(__dirname, '../data/db.json');
    const dbData = await fs.readFile(dbPath, 'utf8');
    const db = JSON.parse(dbData);

    const user = db.users.find((u) => u.username === decoded.username);
    if (!user || !user.active) {
      return res.status(403).json({ error: 'User not found or inactive' });
    }

    req.user = { id: user.id, username: user.username, role: user.role };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { authenticateToken, requireAdmin };
