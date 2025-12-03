# SQL Schema Files Reference

This folder contains SQL schema files for the Barangay Digital Services project.

## Files

### ⭐ `supabase-complete-schema.sql` - **USE THIS ONE**

**Complete schema with BOTH Resident and Admin features.**

This is the main schema file you should use. It creates all necessary tables, indexes, and policies for:
- ✅ Resident authentication and features
- ✅ Admin authentication and features  
- ✅ Row Level Security (RLS) for both roles
- ✅ Sample data for testing
- ✅ Dashboard statistics function

**When to use:** For any new Supabase project setup or when you need both Resident and Admin features.

---

### `supabase-schema.sql` - Legacy Resident-Only Version

**Original schema with Resident features only.**

This was the first version that only supported resident functionality. It's kept for reference but is now superseded by the complete schema.

**When to use:** Not recommended. Use `supabase-complete-schema.sql` instead.

---

## Quick Start

### For New Projects

1. Create a new Supabase project
2. Open SQL Editor
3. Copy ALL contents from `supabase-complete-schema.sql`
4. Paste and run in Supabase
5. Done! Your database is ready with:
   - All tables created
   - RLS policies enabled
   - Demo data loaded
   - Indexes for performance
   - Dashboard function created

### What Gets Created

**Tables (8 total):**
1. `users` - All users (residents and admins with role field)
2. `registration_requests` - Pending account approvals
3. `certifications` - Certificate requests
4. `complaints` - User complaints
5. `announcements` - Public announcements
6. `accidents` - Incidents log
7. `notifications` - User notifications
8. `activity_log` - Admin activity tracking

**Features:**
- UUID primary keys for all tables
- Automatic timestamps (created_at, updated_at)
- Foreign key relationships
- Indexes for common queries
- Row Level Security policies
- Demo data for testing
- Dashboard statistics function

### Demo Accounts Created

**Residents:**
- Username: `juan`, Password: `password123`
- Username: `maria`, Password: `password123`
- Username: `jose`, Password: `password123`

**Admin:**
- Username: `admin`, Password: `admin123`

### Sample Data Loaded

- ✅ 3 resident users
- ✅ 1 admin user
- ✅ 3 announcements
- ✅ 2 certification requests
- ✅ 2 complaints
- ✅ 2 accident records

## Schema Differences

### supabase-complete-schema.sql (Recommended)
- 8 tables
- Supports both roles
- Activity log table
- Dashboard stats function
- Complete RLS policies

### supabase-schema.sql (Legacy)
- 6 tables
- Resident features only
- No activity log
- Basic RLS policies

## Updating Existing Database

If you already ran `supabase-schema.sql`, you can update to the complete version:

```sql
-- Add admin user
INSERT INTO users (username, password, name, address, role, active) VALUES
  ('admin', 'admin123', 'Barangay Administrator', 'Barangay Hall', 'admin', true);

-- Add accidents table
CREATE TABLE accidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL,
  location VARCHAR(255) NOT NULL,
  datetime TIMESTAMP NOT NULL,
  severity VARCHAR(20),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add activity_log table
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor VARCHAR(100) NOT NULL,
  action TEXT NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add dashboard function
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
```

Or simply drop all tables and re-run `supabase-complete-schema.sql` (use with caution in production!).

## Security Notes

All tables have Row Level Security (RLS) enabled. The policies:

- **Allow** residents to:
  - Create their own records (certifications, complaints)
  - Read their own data
  - Read public announcements

- **Allow** admins to:
  - Read and manage all data
  - Create announcements
  - Process all requests
  - View activity logs

Adjust RLS policies in Supabase Dashboard based on your specific security requirements.

## Troubleshooting

**"relation does not exist"**
- Run the complete SQL schema first

**"permission denied for table"**
- Check RLS policies in Supabase Dashboard

**"duplicate key value"**
- Demo data may already be inserted
- Either skip inserts or manually clean tables first

**"function does not exist"**
- Run the dashboard function definition from schema

