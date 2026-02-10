/*
  # Add icon column to metric_definitions

  1. Changes
    - Add `icon` column to `metric_definitions` table
      - Type: text (nullable)
      - Default: NULL
      - Allows users to customize the icon for each metric
      - When NULL, the system will fall back to category-based default icons

  2. Notes
    - Backward compatible: existing metrics will have NULL values and use category defaults
    - Icon names correspond to Lucide React icon component names (e.g., 'TrendingUp', 'DollarSign')
    - No data migration needed for existing records
*/

-- Add icon column to metric_definitions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'metric_definitions' AND column_name = 'icon'
  ) THEN
    ALTER TABLE metric_definitions ADD COLUMN icon text;
  END IF;
END $$;
