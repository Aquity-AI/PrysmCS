/*
  # Fix Section Visibility RLS Policies
  
  This migration fixes RLS policies that were preventing disabled sections from being loaded,
  causing section visibility toggles to revert on page reload.
  
  ## Changes
  
  1. **chart_sections table**
     - Drops restrictive policy "Allow anonymous read access to enabled charts" (enabled = true)
     - Adds new permissive policy for anonymous reads that only filters soft-deleted records
  
  2. **page_summaries table**
     - Drops restrictive policy "Allow anonymous read access to page summaries" (enabled = true)
     - Existing "Anonymous users can view page summaries" policy (qual: true) handles all reads
  
  ## Why This Fixes the Bug
  
  The old policies filtered out disabled sections (enabled = false) when loading from the database.
  This caused the disabled state to be lost on reload, as the section would either:
  - Disappear entirely (if only in dedicated table)
  - Revert to enabled (if JSONB blob was stale)
  
  With this fix, disabled sections are properly returned from the database and their state persists.
  
  ## Security
  
  These changes are safe because:
  - The enabled field is a UI display preference, not sensitive data
  - Anonymous users already have full read access via other permissive policies
  - This change only affects read access, not write/delete permissions
*/

-- Drop restrictive chart_sections policy that filtered enabled = true
DROP POLICY IF EXISTS "Allow anonymous read access to enabled charts" ON chart_sections;

-- Add new permissive chart_sections SELECT policy for anonymous users
-- This matches the pattern used for authenticated users (only filter soft-deleted)
DO $$
BEGIN
  -- Check if this policy already exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chart_sections' 
    AND policyname = 'Allow anonymous read access to chart sections'
  ) THEN
    CREATE POLICY "Allow anonymous read access to chart sections"
      ON chart_sections
      FOR SELECT
      TO anon
      USING (deleted_at IS NULL);
  END IF;
END $$;

-- Drop restrictive page_summaries policy that filtered enabled = true
DROP POLICY IF EXISTS "Allow anonymous read access to page summaries" ON page_summaries;

-- Note: page_summaries already has "Anonymous users can view page summaries" with USING (true)
-- which provides full read access, so no new policy is needed