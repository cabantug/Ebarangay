# Barangay Backend API

REST API for Barangay Digital Services.

## Getting Started

### Installation

```bash
npm install
```

### Configuration

Create a `.env` file with:

```
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

### Running

```bash
npm start
```

Or with auto-reload:

```bash
npm run dev
```

### API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Submit registration request
- `GET /api/auth/profile` - Get current user profile (protected)
- `PUT /api/auth/change-password` - Change password (protected)

#### Certifications
- `GET /api/certifications` - Get user's certifications (protected)
- `POST /api/certifications` - Submit certification request (protected)

#### Complaints
- `GET /api/complaints` - Get user's complaints (protected)
- `POST /api/complaints` - Submit complaint (protected)

#### Announcements
- `GET /api/announcements` - Get all announcements
- `POST /api/announcements` - Post announcement (protected)

#### Residents
- `GET /api/residents` - Get residents directory

#### Notifications
- `GET /api/notifications` - Get user notifications (protected)
- `GET /api/notifications/unread-count` - Get unread count (protected)
- `PUT /api/notifications/:id/read` - Mark as read (protected)

### Demo Users

- Username: `juan`, Password: `password123`
- Username: `maria`, Password: `password123`
- Username: `jose`, Password: `password123`

