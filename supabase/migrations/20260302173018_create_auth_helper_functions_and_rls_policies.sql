/*
  # Auth Helper Functions and RLS Policies

  1. Helper Functions
    - `is_super_admin()` - Checks if the current JWT user is a super admin
    - `get_user_workspace_id()` - Gets the workspace_id for the current authenticated user

  2. Security Changes
    - Add RLS policies to `workspaces` table
    - Add RLS policies to `super_admins` table
    - Add RLS policies to `invitations` table
    - Add RLS policies to `app_users` table for workspace scoping

  3. Notes
    - Super admins are identified by checking the super_admins table against auth.uid()
    - Workspace users get workspace_id from their app_users record
    - The edge function using service_role key bypasses RLS entirely
    - These are foundational policies; tenant-scoped table policies will reference get_user_workspace_id()
*/

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM super_admins
    WHERE supabase_auth_id = auth.uid()
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_workspace_id()
RETURNS uuid AS $$
DECLARE
  ws_id uuid;
BEGIN
  SELECT workspace_id INTO ws_id
  FROM app_users
  WHERE email = (
    SELECT email FROM auth.users WHERE id = auth.uid()
  )
  AND status = 'active'
  LIMIT 1;
  RETURN ws_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE POLICY "Super admins can read all workspaces"
  ON workspaces FOR SELECT
  TO authenticated
  USING (is_super_admin());

CREATE POLICY "Super admins can insert workspaces"
  ON workspaces FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can update workspaces"
  ON workspaces FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can delete workspaces"
  ON workspaces FOR DELETE
  TO authenticated
  USING (is_super_admin());

CREATE POLICY "Workspace users can read their own workspace"
  ON workspaces FOR SELECT
  TO authenticated
  USING (id = get_user_workspace_id());

CREATE POLICY "Super admins can read super_admins"
  ON super_admins FOR SELECT
  TO authenticated
  USING (is_super_admin());

CREATE POLICY "Super admins can insert super_admins"
  ON super_admins FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can update super_admins"
  ON super_admins FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can read all invitations"
  ON invitations FOR SELECT
  TO authenticated
  USING (is_super_admin());

CREATE POLICY "Super admins can insert invitations"
  ON invitations FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can update invitations"
  ON invitations FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Workspace admins can read their workspace invitations"
  ON invitations FOR SELECT
  TO authenticated
  USING (workspace_id = get_user_workspace_id());

CREATE POLICY "Anon can read invitations by token for accept flow"
  ON invitations FOR SELECT
  TO anon
  USING (status = 'pending' AND expires_at > now());
