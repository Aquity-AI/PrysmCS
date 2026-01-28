/*
  # Create Success Stories Table

  ## Overview
  This migration creates a table for storing success stories and testimonials that can be
  displayed in the Health Score tab and potentially in other areas of the application.

  ## New Table
  - `success_stories` - Stores testimonials and positive feedback from clients
    - `id` (uuid, primary key) - Unique identifier for each story
    - `client_id` (text) - Reference to the client this story is about
    - `quote` (text) - The testimonial quote
    - `initials` (text) - Anonymous initials (e.g., "J.S.")
    - `context` (text) - Condition/context of the testimonial (e.g., "Hypertension Management")
    - `is_visible` (boolean) - Whether the story should be displayed
    - `created_at` (timestamptz) - When the story was created
    - `updated_at` (timestamptz) - When the story was last updated

  ## Security
  - Enable RLS on the table
  - Add policies for both authenticated and anonymous users

  ## Performance
  - Add index on client_id for faster lookups
  - Add index on is_visible for filtering visible stories
*/

-- Create success stories table
CREATE TABLE IF NOT EXISTS success_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  quote text NOT NULL,
  initials text DEFAULT '',
  context text DEFAULT '',
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE success_stories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated users
CREATE POLICY "Authenticated users can view success stories"
  ON success_stories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert success stories"
  ON success_stories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update success stories"
  ON success_stories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete success stories"
  ON success_stories FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for anonymous users
CREATE POLICY "Anonymous users can view success stories"
  ON success_stories FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can insert success stories"
  ON success_stories FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can update success stories"
  ON success_stories FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous users can delete success stories"
  ON success_stories FOR DELETE
  TO anon
  USING (true);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_success_stories_client_id ON success_stories(client_id);
CREATE INDEX IF NOT EXISTS idx_success_stories_is_visible ON success_stories(is_visible);
CREATE INDEX IF NOT EXISTS idx_success_stories_created_at ON success_stories(created_at DESC);