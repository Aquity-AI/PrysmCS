/*
  # Add show_in_main_tab field to success_stories table

  ## Overview
  This migration adds a new field to the success_stories table to allow individual
  stories to be toggled for display in the main Success Stories tab.

  ## Changes
  1. Add `show_in_main_tab` column
    - Type: boolean
    - Default: true
    - Allows each story to be shown or hidden from the main Success Stories tab
    - Stories can still appear in the Health Score section regardless of this setting

  ## Notes
  - Existing stories will default to being visible in the main tab
  - This field is independent of the `is_visible` field
*/

-- Add show_in_main_tab field to success_stories table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'success_stories' AND column_name = 'show_in_main_tab'
  ) THEN
    ALTER TABLE success_stories ADD COLUMN show_in_main_tab boolean DEFAULT true;
  END IF;
END $$;