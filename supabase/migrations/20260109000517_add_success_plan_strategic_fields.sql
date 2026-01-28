/*
  # Add Strategic Planning Fields to Success Planning

  1. Changes
    - Add `success_criteria` field to store what "good" looks like
    - Add `value_delivered` field to document ROI for renewals  
    - Add `risks_mitigations` field to track and prevent churn

  2. Details
    - All fields are text type to allow detailed documentation
    - Fields are nullable to allow gradual adoption
    - Fields added to `success_planning_overview` table as they apply to the overall client relationship
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'success_planning_overview' AND column_name = 'success_criteria'
  ) THEN
    ALTER TABLE success_planning_overview ADD COLUMN success_criteria text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'success_planning_overview' AND column_name = 'value_delivered'
  ) THEN
    ALTER TABLE success_planning_overview ADD COLUMN value_delivered text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'success_planning_overview' AND column_name = 'risks_mitigations'
  ) THEN
    ALTER TABLE success_planning_overview ADD COLUMN risks_mitigations text;
  END IF;
END $$;