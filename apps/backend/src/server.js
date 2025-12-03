const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/certifications', require('./routes/certifications'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/residents', require('./routes/residents'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/admin', require('./routes/admin'));

// Serve admin panel static files
// From apps/backend/src/ -> go up 2 levels to root, then into admin
const adminPath = path.join(__dirname, '../../', 'admin');
app.use('/admin', express.static(adminPath));

// Serve admin index.html for /admin route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(adminPath, 'index.html'));
});

// Serve admin index.html for /admin/ route
app.get('/admin/', (req, res) => {
  res.sendFile(path.join(adminPath, 'index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Barangay Digital Services API' });
});

// Root route - redirect to admin panel
app.get('/', (req, res) => {
  res.redirect('/admin');
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`🌐 Admin Panel: http://localhost:${PORT}/admin`);
  console.log(`📋 API Health: http://localhost:${PORT}/api/health`);
  console.log(`\n📱 To access from other devices on your network:`);
  console.log(`   Find your local IP address and use: http://YOUR_IP:${PORT}/admin`);
});

