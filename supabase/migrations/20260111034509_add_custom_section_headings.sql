/*
  # Add Custom Section Headings to Page Layouts

  1. Purpose
    - Enable per-page customization of the "Custom Widgets" section heading
    - Stored in layout_config JSONB field for flexibility

  2. Changes
    - No schema changes needed (using existing layout_config JSONB column)
    - This migration adds documentation and initializes default headings for existing layouts

  3. Data Structure
    - layout_config.custom_widgets_heading: string (e.g., "Custom Widgets", "My Analytics", etc.)
    - Default value: "Custom Widgets" if not set

  4. Notes
    - Headings are editable per page (overview, enrollment, financial, etc.)
    - Empty or null values will fall back to "Custom Widgets"
    - Headings support any text up to 100 characters
*/

-- Update existing page_layouts to include default custom_widgets_heading if not already set
UPDATE page_layouts
SET layout_config = jsonb_set(
  COALESCE(layout_config, '{}'::jsonb),
  '{custom_widgets_heading}',
  '"Custom Widgets"'::jsonb,
  true
)
WHERE layout_config IS NULL
   OR NOT (layout_config ? 'custom_widgets_heading');
