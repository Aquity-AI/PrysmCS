/*
  # Create presentation_configs table

  1. New Tables
    - `presentation_configs`
      - `id` (uuid, primary key)
      - `client_id` (text, not null) - the client this presentation belongs to
      - `config_name` (text, default 'Default Presentation') - name for the presentation config
      - `slide_overrides` (jsonb, default '{}') - per-slide customizations keyed by deterministic slide ID: visibility, background, overlay elements, content layout, order overrides
      - `global_settings` (jsonb, default '{}') - animation type, default slide background, compact mode toggle, custom title text
      - `custom_slides` (jsonb, default '[]') - user-created custom slides with full element data
      - `last_opened_at` (timestamptz) - tracks when the presentation was last opened
      - Standard audit columns: created_at, updated_at, deleted_at, deleted_by, deletion_reason, purge_at

  2. Indexes
    - Index on client_id for fast lookups
    - Unique constraint on (client_id, config_name) where deleted_at IS NULL

  3. Security
    - Enable RLS on presentation_configs
    - Add policies for anonymous and authenticated access matching existing patterns
*/

CREATE TABLE IF NOT EXISTS presentation_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  config_name text NOT NULL DEFAULT 'Default Presentation',
  slide_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  global_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  custom_slides jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_opened_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  deleted_by text,
  deletion_reason text,
  purge_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_presentation_configs_client_id
  ON presentation_configs (client_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_presentation_configs_unique_active
  ON presentation_configs (client_id, config_name)
  WHERE deleted_at IS NULL;

ALTER TABLE presentation_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon users can read presentation configs"
  ON presentation_configs
  FOR SELECT
  TO anon
  USING (deleted_at IS NULL);

CREATE POLICY "Anon users can insert presentation configs"
  ON presentation_configs
  FOR INSERT
  TO anon
  WITH CHECK (deleted_at IS NULL);

CREATE POLICY "Anon users can update presentation configs"
  ON presentation_configs
  FOR UPDATE
  TO anon
  USING (deleted_at IS NULL)
  WITH CHECK (deleted_at IS NULL);

CREATE POLICY "Authenticated users can read own presentation configs"
  ON presentation_configs
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can insert presentation configs"
  ON presentation_configs
  FOR INSERT
  TO authenticated
  WITH CHECK (deleted_at IS NULL);

CREATE POLICY "Authenticated users can update presentation configs"
  ON presentation_configs
  FOR UPDATE
  TO authenticated
  USING (deleted_at IS NULL)
  WITH CHECK (deleted_at IS NULL);
