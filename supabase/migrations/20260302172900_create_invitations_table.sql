/*
  # Create Invitations Table

  1. New Tables
    - `invitations`
      - `id` (uuid, primary key) - Unique invitation identifier
      - `token` (uuid, unique) - Unique invitation token for URL
      - `type` (text) - Invitation type: workspace_admin, workspace_user, or super_admin
      - `workspace_id` (uuid, nullable, FK) - Target workspace (null for super admin invites)
      - `invitee_email` (text) - Email address of the person being invited
      - `invitee_name` (text, nullable) - Optional name of the invitee
      - `invited_by` (text) - Email of the person who created the invitation
      - `role` (text) - Role to assign upon acceptance: admin, csm, client, owner, staff
      - `status` (text) - Invitation status: pending, accepted, expired, revoked
      - `expires_at` (timestamptz) - When the invitation expires (default 72 hours)
      - `accepted_at` (timestamptz, nullable) - When the invitation was accepted
      - `created_at` (timestamptz) - Creation timestamp

  2. Security
    - Enable RLS on `invitations` table
    - Policies will be added after auth helper functions

  3. Notes
    - Invitations expire after 72 hours by default
    - Resending creates a new token and revokes the old one
    - All invitation events are tracked in the audit log
*/

CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('workspace_admin', 'workspace_user', 'super_admin')),
  workspace_id uuid REFERENCES workspaces(id),
  invitee_email text NOT NULL,
  invitee_name text,
  invited_by text NOT NULL,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'csm', 'client', 'owner', 'staff')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '72 hours'),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_workspace_id ON invitations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_invitations_invitee_email ON invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
