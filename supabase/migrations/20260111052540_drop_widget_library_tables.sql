/*
  # Drop Widget Library Tables

  This migration removes all tables, indexes, and policies related to the custom widget library feature.

  ## Tables Being Removed
    - `widget_configurations` - Custom widget instances and their configurations
    - `widget_templates` - Widget templates (if exists)
    - `custom_gradients` - Custom gradient definitions for backgrounds
    - `slide_backgrounds` - Slide/page background configurations
    - `calculated_metrics` - Custom calculated metrics definitions

  ## Changes
    1. Drop all widget-related tables
    2. Cascading deletes will remove all associated policies and indexes
    3. This is a clean slate for rebuilding the widget system

  ## Notes
    - All existing widget configurations will be permanently deleted
    - This operation cannot be undone
    - RLS policies will be automatically dropped with the tables
*/

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS widget_configurations CASCADE;
DROP TABLE IF EXISTS widget_templates CASCADE;
DROP TABLE IF EXISTS slide_backgrounds CASCADE;
DROP TABLE IF EXISTS custom_gradients CASCADE;
DROP TABLE IF EXISTS calculated_metrics CASCADE;
