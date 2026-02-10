/*
  # Clear stale snapshot colors from dashboard graphs

  1. Modified Tables
    - `dashboard_graphs`
      - Removes the `colors` key from the `config` JSONB column on all rows
  
  2. Reason
    - Previously, graph creation saved a snapshot of the branding palette colors
      into `config.colors`. This prevented graphs from dynamically adapting when
      the platform branding was changed.
    - After this migration, all graphs derive their colors from the live branding
      palette at render time.

  3. Important Notes
    - This is a data-only migration (no schema changes)
    - No data is lost; only the `colors` key within the JSONB `config` column is removed
    - All other config keys (show_legend, show_grid, height, etc.) are preserved
*/

UPDATE dashboard_graphs
SET config = config - 'colors'
WHERE config ? 'colors';
