/*
  # Create Super Admins Table

  1. New Tables
    - `super_admins`
      - `id` (uuid, primary key) - Unique super admin identifier
      - `supabase_auth_id` (uuid, nullable, unique) - Links to Supabase Auth user
      - `email` (text, unique) - Super admin email address
      - `name` (text) - Display name
      - `role` (text) - Super admin role: owner or staff
      - `status` (text) - Account status: active or inactive
      - `last_login` (timestamptz, nullable) - Last login timestamp
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `super_admins` table
    - Only super admins can read/modify this table (policies added after helper functions)

  3. Notes
    - Completely separate from `app_users` which holds workspace-level users
    - Owner role has full platform control; staff role has limited admin access
    - A trigger prevents deactivating or demoting the last active owner
*/

CREATE TABLE IF NOT EXISTS super_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_auth_id uuid UNIQUE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'staff')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION update_super_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER super_admins_updated_at
  BEFORE UPDATE ON super_admins
  FOR EACH ROW
  EXECUTE FUNCTION update_super_admins_updated_at();

CREATE OR REPLACE FUNCTION prevent_last_owner_removal()
RETURNS TRIGGER AS $$
DECLARE
  active_owner_count integer;
BEGIN
  IF (OLD.role = 'owner' AND OLD.status = 'active') AND
     (NEW.role != 'owner' OR NEW.status != 'active') THEN
    SELECT COUNT(*) INTO active_owner_count
    FROM super_admins
    WHERE role = 'owner' AND status = 'active' AND id != OLD.id;

    IF active_owner_count < 1 THEN
      RAISE EXCEPTION 'Cannot deactivate or demote the last active owner';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER protect_last_owner
  BEFORE UPDATE ON super_admins
  FOR EACH ROW
  EXECUTE FUNCTION prevent_last_owner_removal();
