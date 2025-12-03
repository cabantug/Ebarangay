-- Barangay Digital Services - Complete Supabase Schema
-- This includes tables for both Admin and Resident features

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (residents and admins)
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
  role VARCHAR(20) DEFAULT 'resident', -- 'resident' or 'admin'
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
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  submitted_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES users(id)
);

-- Certifications
CREATE TABLE certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL, -- 'Barangay Clearance', 'Certificate of Residency', etc.
  purpose TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'ready'
  submitted_by VARCHAR(50) NOT NULL,
  submitted_at TIMESTAMP DEFAULT NOW(),
  birth_date DATE,
  address TEXT,
  processed_at TIMESTAMP,
  processed_by UUID REFERENCES users(id),
  notes TEXT,
  document_url TEXT -- URL to generated PDF
);

-- Complaints
CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(50) NOT NULL, -- 'Noise', 'Garbage', 'Traffic', 'Other'
  location VARCHAR(255),
  details TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'open', -- 'open', 'in_progress', 'closed', 'resolved'
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
  type VARCHAR(50) NOT NULL, -- 'event', 'advisory', 'emergency', 'general'
  date VARCHAR(255),
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Accidents/Incidents (admin only)
CREATE TABLE accidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL, -- 'Road', 'Fire', 'Medical', 'Other'
  location VARCHAR(255) NOT NULL,
  datetime TIMESTAMP NOT NULL,
  severity VARCHAR(20), -- 'Low', 'Moderate', 'High', 'Critical'
  description TEXT,
  reported_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL, -- 'certificate', 'complaint', 'announcement'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  resident_username VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP
);

-- Activity log (admin dashboard)
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor VARCHAR(100) NOT NULL, -- Username who performed the action
  action TEXT NOT NULL, -- Description of the action
  entity_type VARCHAR(50), -- 'certification', 'complaint', 'announcement', etc.
  entity_id UUID, -- ID of the affected entity
  metadata JSONB, -- Additional data
  created_at TIMESTAMP DEFAULT NOW()
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

CREATE INDEX idx_accidents_severity ON accidents(severity);
CREATE INDEX idx_accidents_datetime ON accidents(datetime);

CREATE INDEX idx_notifications_resident_username ON notifications(resident_username);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_timestamp ON notifications(timestamp);

CREATE INDEX idx_activity_log_actor ON activity_log(actor);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);

-- Insert demo users (residents)
INSERT INTO users (username, password, name, address, phone, email, purok, occupation, role, active) VALUES
  ('juan', 'password123', 'Juan Dela Cruz', 'Blk 1 Lot 5, Purok 2', '09123456789', 'juan@example.com', '2', 'Teacher', 'resident', true),
  ('maria', 'password123', 'Maria Clara', 'Blk 3 Lot 2, Purok 3', '09876543210', 'maria@example.com', '3', 'Nurse', 'resident', true),
  ('jose', 'password123', 'Jose Rizal', 'Poblacion, Purok 1', '09111111111', 'jose@example.com', '1', 'Engineer', 'resident', true);

-- Insert admin user
INSERT INTO users (username, password, name, address, phone, email, purok, occupation, role, active) VALUES
  ('admin', 'admin123', 'Barangay Administrator', 'Barangay Hall', '09000000000', 'admin@barangay.gov', '1', 'Administrator', 'admin', true);

-- Insert sample announcements
INSERT INTO announcements (title, content, type, date, location) VALUES
  ('Barangay Clean-up Drive', 'Please bring cleaning tools. Snacks will be provided.', 'event', 'Saturday, 7:00 AM', 'Covered Court'),
  ('Water Service Interruption', 'Waterworks maintenance. Prepare stored water in advance.', 'advisory', 'Monday, 1:00 PM - 6:00 PM', 'Entire Barangay'),
  ('Emergency Drill', 'Earthquake and fire drill for all residents and establishments.', 'emergency', 'Next Friday, 3:00 PM', 'Barangay Hall');

-- Insert sample certifications
INSERT INTO certifications (name, type, purpose, status, submitted_by, birth_date, address) VALUES
  ('Juan Dela Cruz', 'Certificate of Residency', 'For employment application', 'pending', 'juan', '1990-01-15', 'Blk 1 Lot 5, Purok 2'),
  ('Maria Clara', 'Barangay Clearance', 'For business permit', 'pending', 'maria', '1995-05-20', 'Blk 3 Lot 2, Purok 3');

-- Insert sample complaints
INSERT INTO complaints (category, location, details, status, complainant, contact) VALUES
  ('Noise', 'Purok 2', 'Loud music playing past midnight', 'open', 'juan', '09123456789'),
  ('Garbage', 'Purok 5', 'Uncollected garbage for 3 days', 'in_progress', 'maria', '09876543210');

-- Insert sample accidents
INSERT INTO accidents (type, location, datetime, severity, description) VALUES
  ('Road', 'Purok 3 Junction', '2025-09-22 18:10:00', 'Moderate', 'Minor vehicular accident, no injuries'),
  ('Fire', 'Purok 1', '2025-09-19 02:30:00', 'High', 'Grass fire near residential area, contained by barangay fire brigade');

-- Enable Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE accidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Users
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (true);
CREATE POLICY "Admins can manage users" ON users FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);

-- RLS Policies for Registration Requests (admins only)
CREATE POLICY "Only admins can read registration requests" ON registration_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "Anyone can create registration requests" ON registration_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Only admins can approve registration requests" ON registration_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);

-- RLS Policies for Certifications
CREATE POLICY "Users can create certifications" ON certifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can read their own certifications" ON certifications FOR SELECT USING (true);
CREATE POLICY "Admins can manage all certifications" ON certifications FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);

-- RLS Policies for Complaints
CREATE POLICY "Users can create complaints" ON complaints FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can read their own complaints" ON complaints FOR SELECT USING (true);
CREATE POLICY "Admins can manage all complaints" ON complaints FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);

-- RLS Policies for Announcements
CREATE POLICY "Everyone can read announcements" ON announcements FOR SELECT USING (true);
CREATE POLICY "Only admins can create announcements" ON announcements FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "Only admins can update announcements" ON announcements FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);

-- RLS Policies for Accidents (admin only)
CREATE POLICY "Only admins can manage accidents" ON accidents FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);

-- RLS Policies for Notifications
CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (true);

-- RLS Policies for Activity Log (admin only)
CREATE POLICY "Only admins can read activity log" ON activity_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "System can insert activity logs" ON activity_log FOR INSERT WITH CHECK (true);

-- Functions for dashboard statistics (can be called from admin panel)
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
  pending_requests BIGINT,
  open_complaints BIGINT,
  total_announcements BIGINT,
  total_residents BIGINT,
  recent_accidents BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM certifications WHERE status = 'pending')::BIGINT,
    (SELECT COUNT(*) FROM complaints WHERE status IN ('open', 'in_progress'))::BIGINT,
    (SELECT COUNT(*) FROM announcements)::BIGINT,
    (SELECT COUNT(*) FROM users WHERE role = 'resident' AND active = true)::BIGINT,
    (SELECT COUNT(*) FROM accidents WHERE datetime > NOW() - INTERVAL '7 days')::BIGINT;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO authenticated;

