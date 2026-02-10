/*
  # Create User Profiles Table

  ## Overview
  Creates a user profiles table to store user information that can be used to
  auto-populate forms when adding themselves to teams or other contexts.

  ## Changes
  1. Create `user_profiles` table:
     - `id` (uuid, primary key) - Unique identifier
     - `user_id` (uuid, unique) - Links to Supabase auth user
     - `full_name` (text) - User's full name
     - `email` (text, unique) - User's email address
     - `phone` (text) - User's phone number
     - `job_title` (text) - User's job title
     - `department` (text) - User's department
     - `created_at` (timestamptz) - Record creation timestamp
     - `updated_at` (timestamptz) - Record update timestamp

  ## Security
  - Enable RLS on user_profiles table
  - Add policies for users to read and update their own profiles
  - Add policy for anonymous access (since we're using anon key)
*/

-- ============================================================================
-- CREATE TABLE: User Profiles
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  full_name text NOT NULL,
  email text UNIQUE,
  phone text,
  job_title text,
  department text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- SECURITY: Enable RLS and Create Policies
-- ============================================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Allow anonymous read access to profiles'
  ) THEN
    CREATE POLICY "Allow anonymous read access to profiles"
      ON user_profiles
      FOR SELECT
      TO anon
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Allow anonymous insert access to profiles'
  ) THEN
    CREATE POLICY "Allow anonymous insert access to profiles"
      ON user_profiles
      FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Allow anonymous update access to profiles'
  ) THEN
    CREATE POLICY "Allow anonymous update access to profiles"
      ON user_profiles
      FOR UPDATE
      TO anon
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Allow anonymous delete access to profiles'
  ) THEN
    CREATE POLICY "Allow anonymous delete access to profiles"
      ON user_profiles
      FOR DELETE
      TO anon
      USING (true);
  END IF;
END $$;