/*
  # Create Custom Gradients Table

  1. New Tables
    - `custom_gradients`
      - `id` (uuid, primary key)
      - `client_id` (text, nullable for global presets)
      - `workspace_id` (uuid, FK to workspaces, nullable)
      - `name` (text, display name)
      - `category` (text, categorization: professional, vibrant, minimalist, nature, custom)
      - `gradient_css` (text, complete CSS gradient string)
      - `gradient_type` (text, linear or radial)
      - `colors` (jsonb, array of color stop objects)
      - `angle` (integer, gradient angle in degrees)
      - `is_preset` (boolean, true for system presets)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `deleted_at` (timestamptz, soft delete)
      - `deleted_by` (text)
      - `deletion_reason` (text)
      - `purge_at` (timestamptz)

  2. Security
    - Enable RLS on `custom_gradients` table
    - Add policies for anon and authenticated users matching presentation_configs pattern

  3. Notes
    - Supports both global presets (is_preset=true, client_id=null) and user-saved gradients
    - Soft delete pattern matches project conventions
    - Workspace-scoped with FK to workspaces table
*/

CREATE TABLE IF NOT EXISTS custom_gradients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text,
  workspace_id uuid REFERENCES workspaces(id),
  name text NOT NULL,
  category text DEFAULT 'custom',
  gradient_css text NOT NULL,
  gradient_type text DEFAULT 'linear',
  colors jsonb NOT NULL DEFAULT '[]'::jsonb,
  angle integer DEFAULT 135,
  is_preset boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  deleted_by text,
  deletion_reason text,
  purge_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_custom_gradients_client ON custom_gradients(client_id);
CREATE INDEX IF NOT EXISTS idx_custom_gradients_workspace ON custom_gradients(workspace_id);
CREATE INDEX IF NOT EXISTS idx_custom_gradients_preset ON custom_gradients(is_preset);

ALTER TABLE custom_gradients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon users can read custom gradients"
  ON custom_gradients FOR SELECT
  TO anon
  USING (deleted_at IS NULL);

CREATE POLICY "Anon users can insert custom gradients"
  ON custom_gradients FOR INSERT
  TO anon
  WITH CHECK (deleted_at IS NULL);

CREATE POLICY "Anon users can update custom gradients"
  ON custom_gradients FOR UPDATE
  TO anon
  USING (deleted_at IS NULL)
  WITH CHECK (deleted_at IS NULL);

CREATE POLICY "Anon users can delete custom gradients"
  ON custom_gradients FOR DELETE
  TO anon
  USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can read custom gradients"
  ON custom_gradients FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can insert custom gradients"
  ON custom_gradients FOR INSERT
  TO authenticated
  WITH CHECK (deleted_at IS NULL);

CREATE POLICY "Authenticated users can update custom gradients"
  ON custom_gradients FOR UPDATE
  TO authenticated
  USING (deleted_at IS NULL)
  WITH CHECK (deleted_at IS NULL);
