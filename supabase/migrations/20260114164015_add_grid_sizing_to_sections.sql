/*
  # Add Grid Sizing to Sections

  1. Purpose
    - Enable 12-column grid-based layout system for flexible section sizing
    - Allow users to configure section widths through configuration modals
    - Support responsive grid layouts with automatic row wrapping

  2. Changes to Existing Tables
    - `chart_sections`
      - Add `width_units` (1-12 columns, default 12 for full width)
      - Add `row_position` for explicit grid row placement
      - Add `column_position` for explicit grid column placement

    - `page_summaries`
      - Add `width_units` (1-12 columns, default 12 for full width)
      - Add `row_position` for explicit grid row placement
      - Add `column_position` for explicit grid column placement

  3. Grid System
    - 12-column grid system (like Bootstrap/Tailwind)
    - Sections can span 1-12 columns with complete freedom
    - Automatic row wrapping when sections exceed 12 columns
    - Responsive behavior at mobile/tablet breakpoints

  4. Backward Compatibility
    - All existing sections default to width_units = 12 (full width)
    - Positions default to NULL for automatic flow-based placement
    - No breaking changes to existing functionality
*/

-- ============================================================================
-- ALTER TABLE: chart_sections - Add Grid Sizing Fields
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chart_sections' AND column_name = 'width_units'
  ) THEN
    ALTER TABLE chart_sections
    ADD COLUMN width_units integer DEFAULT 12 NOT NULL,
    ADD COLUMN row_position integer DEFAULT NULL,
    ADD COLUMN column_position integer DEFAULT NULL,
    ADD CONSTRAINT width_units_range CHECK (width_units >= 1 AND width_units <= 12);
  END IF;
END $$;

-- ============================================================================
-- ALTER TABLE: page_summaries - Add Grid Sizing Fields
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'page_summaries' AND column_name = 'width_units'
  ) THEN
    ALTER TABLE page_summaries
    ADD COLUMN width_units integer DEFAULT 12 NOT NULL,
    ADD COLUMN row_position integer DEFAULT NULL,
    ADD COLUMN column_position integer DEFAULT NULL,
    ADD CONSTRAINT width_units_range_summaries CHECK (width_units >= 1 AND width_units <= 12);
  END IF;
END $$;

-- ============================================================================
-- UPDATE: Set all existing records to full width (backward compatibility)
-- ============================================================================
UPDATE chart_sections SET width_units = 12 WHERE width_units IS NULL;
UPDATE page_summaries SET width_units = 12 WHERE width_units IS NULL;

-- ============================================================================
-- INDEXES: Add indexes for grid positioning queries
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_chart_sections_grid_position
  ON chart_sections(client_id, page_id, row_position, column_position);

CREATE INDEX IF NOT EXISTS idx_page_summaries_grid_position
  ON page_summaries(client_id, page_id, row_position, column_position);

-- ============================================================================
-- COMMENTS: Document the grid system
-- ============================================================================
COMMENT ON COLUMN chart_sections.width_units IS
  'Grid column span (1-12). 12 = full width, 6 = half width, 4 = third width, etc.';

COMMENT ON COLUMN chart_sections.row_position IS
  'Optional explicit row position for grid layout. NULL = auto-flow based on display_order.';

COMMENT ON COLUMN chart_sections.column_position IS
  'Optional explicit column position within row. NULL = auto-flow left-to-right.';

COMMENT ON COLUMN page_summaries.width_units IS
  'Grid column span (1-12). 12 = full width, 6 = half width, 4 = third width, etc.';

COMMENT ON COLUMN page_summaries.row_position IS
  'Optional explicit row position for grid layout. NULL = auto-flow based on display_order.';

COMMENT ON COLUMN page_summaries.column_position IS
  'Optional explicit column position within row. NULL = auto-flow left-to-right.';