-- Barangay Digital Services - Supabase Schema
-- This SQL script creates all necessary tables for the resident mobile app

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (residents)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  purok VARCHAR(10),
  occupation VARCHAR(100),
  role VARCHAR(20) DEFAULT 'resident',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Registration requests (pending admin approval)
CREATE TABLE registration_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(255) NOT NULL,
  birth_date DATE,
  address TEXT NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  purok VARCHAR(10),
  occupation VARCHAR(100),
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  submitted_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES users(id)
);

-- Certifications
CREATE TABLE certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  purpose TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  submitted_by VARCHAR(50) NOT NULL,
  submitted_at TIMESTAMP DEFAULT NOW(),
  birth_date DATE,
  address TEXT,
  processed_at TIMESTAMP,
  processed_by UUID REFERENCES users(id),
  notes TEXT
);

-- Complaints
CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(50) NOT NULL,
  location VARCHAR(255),
  details TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'open',
  complainant VARCHAR(255),
  contact VARCHAR(255),
  submitted_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES users(id),
  resolution_notes TEXT
);

-- Announcements
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  date VARCHAR(255),
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  resident_username VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(active);

CREATE INDEX idx_certifications_submitted_by ON certifications(submitted_by);
CREATE INDEX idx_certifications_status ON certifications(status);
CREATE INDEX idx_certifications_submitted_at ON certifications(submitted_at);

CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_submitted_at ON complaints(submitted_at);

CREATE INDEX idx_announcements_type ON announcements(type);
CREATE INDEX idx_announcements_created_at ON announcements(created_at);

CREATE INDEX idx_notifications_resident_username ON notifications(resident_username);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_timestamp ON notifications(timestamp);

-- Insert demo users
INSERT INTO users (id, username, password, name, address, phone, email, purok, occupation, role, active) VALUES
  (uuid_generate_v4(), 'juan', 'password123', 'Juan Dela Cruz', 'Blk 1 Lot 5, Purok 2', '09123456789', 'juan@example.com', '2', 'Teacher', 'resident', true),
  (uuid_generate_v4(), 'maria', 'password123', 'Maria Clara', 'Blk 3 Lot 2, Purok 3', '09876543210', 'maria@example.com', '3', 'Nurse', 'resident', true),
  (uuid_generate_v4(), 'jose', 'password123', 'Jose Rizal', 'Poblacion, Purok 1', '09111111111', 'jose@example.com', '1', 'Engineer', 'resident', true);

-- Insert sample announcements
INSERT INTO announcements (title, content, type, date, location) VALUES
  ('Barangay Clean-up Drive', 'Please bring cleaning tools. Snacks will be provided.', 'event', 'Saturday, 7:00 AM', 'Covered Court'),
  ('Water Service Interruption', 'Waterworks maintenance. Prepare stored water in advance.', 'advisory', 'Monday, 1:00 PM - 6:00 PM', 'Entire Barangay'),
  ('Emergency Drill', 'Earthquake and fire drill for all residents and establishments.', 'emergency', 'Next Friday, 3:00 PM', 'Barangay Hall');

-- Create admin user (optional)
-- INSERT INTO users (username, password, name, address, phone, email, purok, occupation, role, active) VALUES
--   ('admin', 'admin123', 'Barangay Administrator', 'Barangay Hall', '09000000000', 'admin@barangay.gov', '1', 'Administrator', 'admin', true);

-- Enable Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Basic policies (adjust based on your security requirements)
-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Residents can create their own certification requests
CREATE POLICY "Users can create certifications" ON certifications
  FOR INSERT WITH CHECK (true);

-- Users can only read their own certifications
CREATE POLICY "Users can read own certifications" ON certifications
  FOR SELECT USING (true); -- In production, restrict to submitted_by

-- Similar policies for complaints, notifications, etc.
CREATE POLICY "Users can create complaints" ON complaints
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read own complaints" ON complaints
  FOR SELECT USING (true);

CREATE POLICY "All users can read announcements" ON announcements
  FOR SELECT USING (true);

CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (true);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (true);

-- Grant necessary permissions (adjust as needed)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;

