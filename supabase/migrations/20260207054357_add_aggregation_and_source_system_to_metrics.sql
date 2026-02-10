/*
  # Add default_aggregation and source_system to metric_definitions

  1. Modified Tables
    - `metric_definitions`
      - `default_aggregation` (text, nullable, default 'avg') - preferred rollup method (sum, avg, min, max, count)
      - `source_system` (text, nullable) - optional label for the data source system or API (e.g., billing_api)

  2. Notes
    - Both columns are nullable with sensible defaults
    - No existing data or queries are affected
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'metric_definitions' AND column_name = 'default_aggregation'
  ) THEN
    ALTER TABLE metric_definitions ADD COLUMN default_aggregation text DEFAULT 'avg';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'metric_definitions' AND column_name = 'source_system'
  ) THEN
    ALTER TABLE metric_definitions ADD COLUMN source_system text;
  END IF;
END $$;