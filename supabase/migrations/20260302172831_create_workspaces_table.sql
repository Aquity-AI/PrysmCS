/*
  # Create Workspaces Table

  1. New Tables
    - `workspaces`
      - `id` (uuid, primary key) - Unique workspace identifier
      - `slug` (text, unique) - URL-safe workspace identifier for routing
      - `name` (text) - Display name of the workspace (company name)
      - `owner_email` (text) - Email of the workspace owner/primary admin
      - `status` (text) - Workspace lifecycle status: active, paused, archived, deleted
      - `plan_tier` (text, nullable) - Future billing tier placeholder
      - `billing_contact_name` (text, nullable) - Billing contact person
      - `billing_contact_email` (text, nullable) - Billing contact email
      - `billing_notes` (text, nullable) - Additional billing notes
      - `paused_at` (timestamptz, nullable) - When workspace was paused
      - `paused_reason` (text, nullable) - Reason for pausing
      - `archived_at` (timestamptz, nullable) - When workspace was archived
      - `archived_by` (text, nullable) - Who archived the workspace
      - `deleted_at` (timestamptz, nullable) - Soft delete timestamp
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `workspaces` table
    - Super admin access policies will be added after helper functions are created
    - Workspace members can read their own workspace

  3. Notes
    - This is the canonical tenant record. One workspace = one B2B customer of Aquity.
    - Clients (healthcare practices) are sub-entities within a workspace.
    - The slug is used for URL routing and must be unique and URL-safe.
*/

CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  owner_email text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived', 'deleted')),
  plan_tier text,
  billing_contact_name text,
  billing_contact_email text,
  billing_notes text,
  paused_at timestamptz,
  paused_reason text,
  archived_at timestamptz,
  archived_by text,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION update_workspaces_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION update_workspaces_updated_at();
