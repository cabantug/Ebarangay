const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const dbPath = path.join(__dirname, '../data/db.json');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

const COLLECTION_KEYS = [
  'registrationRequests',
  'certifications',
  'complaints',
  'announcements',
  'accidents',
  'residents',
  'messages',
  'activity',
  'notifications',
];

async function getDB() {
  const raw = await fs.readFile(dbPath, 'utf8');
  const db = JSON.parse(raw);
  COLLECTION_KEYS.forEach((key) => {
    if (!Array.isArray(db[key])) {
      db[key] = [];
    }
  });
  if (!Array.isArray(db.users)) {
    db.users = [];
  }
  return db;
}

async function saveDB(db) {
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
}

function addActivity(db, { actor = 'Admin', action }) {
  if (!action) return;
  db.activity.unshift({
    when: new Date().toISOString(),
    actor,
    action,
  });
  db.activity = db.activity.slice(0, 100);
}

function nextId(items) {
  if (!items || items.length === 0) return 1;
  return Math.max(...items.map((item) => Number(item.id) || 0)) + 1;
}

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const db = await getDB();
    const user = db.users.find(
      (u) => u.username === username && u.role === 'admin' && u.active !== false,
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    let passwordMatch = false;
    if (user.password && user.password.startsWith('$2')) {
      passwordMatch = await bcrypt.compare(password, user.password);
    } else if (user.password) {
      passwordMatch = password === user.password;
    }

    if (!passwordMatch) {
      const envUser = process.env.ADMIN_USERNAME;
      const envPass = process.env.ADMIN_PASSWORD;
      if (envUser && envPass && username === envUser && password === envPass) {
        passwordMatch = true;
      }
    }

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '12h' },
    );

    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.use(authenticateToken, requireAdmin);

router.get('/me', async (req, res) => {
  try {
    const db = await getDB();
    const user = db.users.find((u) => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Admin user not found' });
    }
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/dashboard', async (_req, res) => {
  try {
    const db = await getDB();
    res.json({
      pendingRequests: db.certifications.filter((c) => c.status === 'Pending').length,
      openComplaints: db.complaints.filter((c) =>
        ['Open', 'In Progress'].includes(c.status),
      ).length,
      announcements: db.announcements.length,
      residents: db.residents.filter((r) => !r.archived).length,
      unreadMessages: db.messages.filter(
        (m) => m.to?.toLowerCase() === 'admin' && !m.read,
      ).length,
      activity: db.activity.slice(0, 10),
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/activity', async (req, res) => {
  try {
    const { actor = 'Admin', action } = req.body || {};
    if (!action) {
      return res.status(400).json({ error: 'Activity action is required' });
    }
    const db = await getDB();
    addActivity(db, { actor, action });
    await saveDB(db);
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Activity log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/certifications', async (_req, res) => {
  try {
    const db = await getDB();
    const items = [...db.certifications].sort(
      (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt),
    );
    res.json(items);
  } catch (error) {
    console.error('List certifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/certifications/:id/status', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body || {};
    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const db = await getDB();
    const cert = db.certifications.find((c) => c.id === id);
    if (!cert) {
      return res.status(404).json({ error: 'Certification not found' });
    }

    cert.status = status;
    if (status === 'Approved') {
      addActivity(db, {
        action: `Approved certification #${id} for ${cert.name}`,
      });
    } else if (status === 'Rejected') {
      addActivity(db, {
        action: `Rejected certification #${id} for ${cert.name}`,
      });
    }

    await saveDB(db);
    res.json(cert);
  } catch (error) {
    console.error('Update certification status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/complaints', async (_req, res) => {
  try {
    const db = await getDB();
    res.json(db.complaints);
  } catch (error) {
    console.error('List complaints error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/complaints/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const updates = req.body || {};
    const db = await getDB();
    const complaint = db.complaints.find((c) => c.id === id);

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    Object.assign(complaint, updates);
    if (updates.status) {
      addActivity(db, {
        action: `Updated complaint #${id} to ${updates.status}`,
      });
    }

    await saveDB(db);
    res.json(complaint);
  } catch (error) {
    console.error('Update complaint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/announcements', async (_req, res) => {
  try {
    const db = await getDB();
    const items = [...db.announcements].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
    res.json(items);
  } catch (error) {
    console.error('List announcements error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/announcements', async (req, res) => {
  try {
    const { title, type, body, date } = req.body || {};
    if (!title || !type || !body) {
      return res.status(400).json({ error: 'Title, type, and body are required' });
    }

    const db = await getDB();
    const announcement = {
      id: nextId(db.announcements),
      title,
      type,
      body,
      date: date || new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    };

    db.announcements.unshift(announcement);
    addActivity(db, { action: `Posted announcement "${title}"` });
    await saveDB(db);
    res.status(201).json(announcement);
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/announcements/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const updates = req.body || {};
    const db = await getDB();
    const announcement = db.announcements.find((a) => a.id === id);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    Object.assign(announcement, updates);
    addActivity(db, { action: `Updated announcement #${id}` });
    await saveDB(db);
    res.json(announcement);
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/announcements/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const db = await getDB();
    const before = db.announcements.length;
    db.announcements = db.announcements.filter((a) => a.id !== id);
    if (db.announcements.length === before) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    addActivity(db, { action: `Deleted announcement #${id}` });
    await saveDB(db);
    res.status(204).send();
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/accidents', async (_req, res) => {
  try {
    const db = await getDB();
    res.json(db.accidents);
  } catch (error) {
    console.error('List accidents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/accidents/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const updates = req.body || {};
    const db = await getDB();
    const accident = db.accidents.find((a) => a.id === id);
    if (!accident) {
      return res.status(404).json({ error: 'Accident not found' });
    }
    Object.assign(accident, updates);
    addActivity(db, { action: `Updated accident #${id}` });
    await saveDB(db);
    res.json(accident);
  } catch (error) {
    console.error('Update accident error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/residents', async (_req, res) => {
  try {
    const db = await getDB();
    res.json(db.residents);
  } catch (error) {
    console.error('List residents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/residents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    const db = await getDB();
    const resident = db.residents.find((r) => r.id === id);
    if (!resident) {
      return res.status(404).json({ error: 'Resident not found' });
    }
    Object.assign(resident, updates);
    addActivity(db, { action: `Updated resident ${id}` });
    await saveDB(db);
    res.json(resident);
  } catch (error) {
    console.error('Update resident error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/residents/:id/archive', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDB();
    const resident = db.residents.find((r) => r.id === id);
    if (!resident) {
      return res.status(404).json({ error: 'Resident not found' });
    }
    resident.archived = true;
    addActivity(db, { action: `Archived resident ${id}` });
    await saveDB(db);
    res.json(resident);
  } catch (error) {
    console.error('Archive resident error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/messages', async (_req, res) => {
  try {
    const db = await getDB();
    const items = [...db.messages].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
    );
    res.json(items);
  } catch (error) {
    console.error('List messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/messages/thread/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const db = await getDB();
    const thread = db.messages
      .filter(
        (m) =>
          (m.from === username && m.to === 'Admin') ||
          (m.from === 'Admin' && m.to === username),
      )
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    db.messages.forEach((m) => {
      if (m.from === username && m.to === 'Admin') {
        m.read = true;
      }
    });
    await saveDB(db);

    res.json(thread);
  } catch (error) {
    console.error('Get message thread error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/messages/:id/reply', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { message } = req.body || {};
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }
    const db = await getDB();
    const original = db.messages.find((m) => m.id === id);
    if (!original) {
      return res.status(404).json({ error: 'Original message not found' });
    }

    const reply = {
      id: nextId(db.messages),
      threadId: original.threadId || original.id,
      from: 'Admin',
      to: original.from,
      message: message.trim(),
      timestamp: new Date().toISOString(),
      isReply: true,
      read: false,
    };

    db.messages.push(reply);
    addActivity(db, { action: `Replied to ${original.from}` });
    await saveDB(db);
    res.status(201).json(reply);
  } catch (error) {
    console.error('Reply to message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/registrations', async (_req, res) => {
  try {
    const db = await getDB();
    const items = [...db.registrationRequests].sort(
      (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt),
    );
    res.json(items);
  } catch (error) {
    console.error('List registrations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/registrations/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body || {};
    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const db = await getDB();
    const request = db.registrationRequests.find((r) => r.id === id);
    if (!request) {
      return res.status(404).json({ error: 'Registration request not found' });
    }

    request.status = status;

    if (status === 'Approved') {
      const usernameExists = db.users.some((u) => u.username === request.username);
      if (usernameExists) {
        return res
          .status(400)
          .json({ error: 'Username already exists in user records' });
      }

      const newUserId = nextId(db.users);
      const hashedPassword = request.password.startsWith('$2')
        ? request.password
        : await bcrypt.hash(request.password, 10);

      db.users.push({
        id: newUserId,
        username: request.username,
        password: hashedPassword,
        name: request.fullName,
        address: request.address,
        phone: request.phone,
        email: request.email,
        purok: request.purok,
        occupation: request.occupation,
        role: 'resident',
        active: true,
      });

      const newResidentId = `R-${100 + db.residents.length + 1}`;
      db.residents.push({
        id: newResidentId,
        name: request.fullName,
        age:
          new Date().getFullYear() - new Date(request.birthDate || '2000-01-01').getFullYear(),
        purok: request.purok,
        address: request.address,
        phone: request.phone,
        email: request.email,
        archived: false,
        registeredAt: new Date().toISOString(),
      });

      addActivity(db, { action: `Approved registration #${id} (${request.fullName})` });
    } else if (status === 'Rejected') {
      addActivity(db, { action: `Rejected registration #${id} (${request.fullName})` });
    }

    await saveDB(db);
    res.json(request);
  } catch (error) {
    console.error('Update registration status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;


