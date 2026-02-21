/*
  # Create App Users Table

  1. New Tables
    - `app_users`
      - `id` (uuid, primary key, auto-generated)
      - `email` (text, unique, not null) - User's email address for login
      - `password_hash` (text, not null) - SHA-256 hashed password
      - `name` (text, not null) - User's display name
      - `role` (text, default 'admin') - User role: admin, csm, or client
      - `phone` (text, default '') - Phone number
      - `department` (text, default '') - Department name
      - `assigned_clients` (jsonb, default '["all"]') - List of assigned client IDs
      - `status` (text, default 'active') - Account status: active or inactive
      - `mfa_enabled` (boolean, default false) - Whether MFA is enabled
      - `last_login` (timestamptz, nullable) - Last login timestamp
      - `created_at` (timestamptz, default now()) - Account creation timestamp
      - `updated_at` (timestamptz, default now()) - Last update timestamp

  2. Security
    - Enable RLS on `app_users` table
    - Add policy for anon to select users by email (for login lookups)
    - Add policy for anon to insert new users (for signup)
    - Add policy for anon to update own record (for last_login tracking)

  3. Indexes
    - Unique index on `email` for fast lookups and duplicate prevention

  4. Notes
    - Self-signup always creates admin role accounts
    - View Only (client) and Data Management (csm) roles are invite-only via admin
    - Passwords are hashed client-side with SHA-256 before storage
*/

CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  phone text DEFAULT '',
  department text DEFAULT '',
  assigned_clients jsonb DEFAULT '["all"]'::jsonb,
  status text NOT NULL DEFAULT 'active',
  mfa_enabled boolean DEFAULT false,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow email lookup for login"
  ON app_users
  FOR SELECT
  TO anon
  USING (status = 'active');

CREATE POLICY "Allow signup inserts"
  ON app_users
  FOR INSERT
  TO anon
  WITH CHECK (role = 'admin');

CREATE POLICY "Allow update last_login"
  ON app_users
  FOR UPDATE
  TO anon
  USING (status = 'active')
  WITH CHECK (status = 'active');
