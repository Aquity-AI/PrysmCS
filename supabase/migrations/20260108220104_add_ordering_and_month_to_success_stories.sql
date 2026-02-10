/*
  # Add Ordering and Month Fields to Success Stories

  ## Overview
  This migration adds fields to support unified success stories management between
  Dashboard Management and Success Planning sections.

  ## Changes
  1. Add `display_order` field
    - Type: integer
    - Default: 0
    - Allows stories to be reordered in Dashboard Management
    
  2. Add `month_association` field
    - Type: text
    - Optional field to maintain Dashboard Management's monthly organization
    - Format: "YYYY-MM" (e.g., "2024-01")
    
  ## Performance
  - Add index on display_order for efficient sorting
  - Add index on month_association for month-based filtering
*/

-- Add display_order field for reordering capability
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'success_stories' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE success_stories ADD COLUMN display_order integer DEFAULT 0;
  END IF;
END $$;

-- Add month_association field for monthly organization
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'success_stories' AND column_name = 'month_association'
  ) THEN
    ALTER TABLE success_stories ADD COLUMN month_association text;
  END IF;
END $$;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_success_stories_display_order ON success_stories(display_order);
CREATE INDEX IF NOT EXISTS idx_success_stories_month_association ON success_stories(month_association);