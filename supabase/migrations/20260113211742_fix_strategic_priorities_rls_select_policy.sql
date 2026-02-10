/*
  # Fix Strategic Priorities RLS SELECT Policy
  
  ## Problem
  The SELECT policy for anonymous users only allowed viewing records where is_visible = true.
  This caused UPDATE operations to fail when changing is_visible to false, because PostgreSQL
  requires SELECT permission on a row to update it, creating a catch-22.
  
  ## Solution
  Update the anonymous SELECT policy to allow viewing all strategic priorities (not just visible ones).
  This matches the pattern used for authenticated users and allows the Data Management interface
  to toggle visibility without permission errors.
  
  ## Changes
  - Drop the restrictive SELECT policy for anonymous users
  - Create a new SELECT policy that allows viewing all records
*/

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Anonymous users can view visible strategic priorities" ON strategic_priorities;

-- Create a new policy that allows viewing all records
CREATE POLICY "Anonymous users can view all strategic priorities"
  ON strategic_priorities
  FOR SELECT
  TO anon
  USING (true);
