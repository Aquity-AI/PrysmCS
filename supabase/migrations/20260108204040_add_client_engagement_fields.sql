/*
  # Add Client Engagement Fields

  ## Overview
  Adds fields to track client communication and engagement preferences.

  ## Changes
  1. Add `meeting_cadence` column - Documents when and how often meetings occur
  2. Add `hours_of_operation` column - Tracks client's business hours
  3. Add `communication_preferences` column - Notes on preferred communication methods

  ## Notes
  - All fields are optional text fields
  - Uses IF NOT EXISTS pattern to ensure idempotent migrations
*/

-- ============================================================================
-- ADD COLUMNS: Client Engagement and Communication Fields
-- ============================================================================
DO $$
BEGIN
  -- Add meeting_cadence column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'success_planning_overview' AND column_name = 'meeting_cadence'
  ) THEN
    ALTER TABLE success_planning_overview ADD COLUMN meeting_cadence text;
  END IF;

  -- Add hours_of_operation column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'success_planning_overview' AND column_name = 'hours_of_operation'
  ) THEN
    ALTER TABLE success_planning_overview ADD COLUMN hours_of_operation text;
  END IF;

  -- Add communication_preferences column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'success_planning_overview' AND column_name = 'communication_preferences'
  ) THEN
    ALTER TABLE success_planning_overview ADD COLUMN communication_preferences text;
  END IF;
END $$;