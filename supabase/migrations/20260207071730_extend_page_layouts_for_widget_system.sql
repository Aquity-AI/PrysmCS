/*
  # Extend Page Layouts for Universal Widget System

  1. Description
    - This migration documents and validates the existing page_layouts table structure
    - The layout_config JSONB column already supports our widget positioning needs
    - Adding an index for faster queries by client_id and page_id combination

  2. Existing Structure (layout_config JSONB):
    - widgetOrder: Array of widget IDs in display order
    - hiddenWidgets: Array of widget IDs that are hidden
    - widgetPositions: Object mapping widgetId to position data
      - Each position includes: order, gridRow, gridColumn, gridWidth, gridHeight

  3. Enhanced Structure (backwards compatible):
    - version: Schema version number for future migrations
    - widgets: Array of full widget position objects (alternative to widgetPositions map)
    - gridDensity: compact | normal | spacious (stored in dedicated column)

  4. Security
    - RLS policies already exist for page_layouts table
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'page_layouts' 
    AND indexname = 'idx_page_layouts_client_page'
  ) THEN
    CREATE INDEX idx_page_layouts_client_page 
    ON page_layouts(client_id, page_id) 
    WHERE deleted_at IS NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'page_layouts' 
    AND indexname = 'idx_page_layouts_client_id'
  ) THEN
    CREATE INDEX idx_page_layouts_client_id 
    ON page_layouts(client_id) 
    WHERE deleted_at IS NULL;
  END IF;
END $$;
