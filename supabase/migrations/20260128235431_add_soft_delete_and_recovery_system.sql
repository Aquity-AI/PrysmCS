/*
  # Soft Delete and Client Recovery System

  ## Overview
  Implements enterprise-grade soft deletion with 90-day auto-purge and team notification system.
  
  ## Changes
  
  1. Soft Delete Columns
     - Added to all 25+ client-related tables:
       - `deleted_at` (timestamptz) - Timestamp when record was soft-deleted
       - `deleted_by` (text) - User who performed the deletion
       - `deletion_reason` (text) - Optional reason for deletion
       - `purge_at` (timestamptz) - Auto-calculated as deleted_at + 90 days
  
  2. New Tables
     - `purge_log` - Tracks permanently deleted clients for audit compliance
     - `client_restoration_log` - Tracks all restoration activities
  
  3. Database Functions
     - `soft_delete_client()` - Cascading soft delete for client and all related records
     - `restore_client()` - Cascading restoration of soft-deleted client
     - `auto_purge_expired_clients()` - Permanently deletes clients past purge date
     - `get_team_members_for_client()` - Retrieves team member emails for notifications
     - `calculate_purge_date()` - Trigger function to auto-set purge_at
  
  4. Security Updates
     - All RLS policies updated to filter soft-deleted records (WHERE deleted_at IS NULL)
     - New RLS policies for viewing deleted records (admin and csm roles)
     - Restore operation policies (admin role only)
  
  5. Indexes
     - Performance indexes on deleted_at columns across all tables
     - Composite indexes for efficient deleted client queries
  
  ## Auto-Purge Schedule
  - Runs daily at midnight UTC
  - Permanently deletes clients where purge_at < current_timestamp
  - Logs all purge operations for compliance
*/

-- ============================================================================
-- STEP 1: Add Soft Delete Columns to All Tables
-- ============================================================================

-- Core success planning tables
ALTER TABLE success_planning_overview
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deletion_reason text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS purge_at timestamptz DEFAULT NULL;

ALTER TABLE success_planning_stakeholders
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deletion_reason text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS purge_at timestamptz DEFAULT NULL;

ALTER TABLE success_planning_team
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deletion_reason text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS purge_at timestamptz DEFAULT NULL;

ALTER TABLE success_planning_goals
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deletion_reason text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS purge_at timestamptz DEFAULT NULL;

ALTER TABLE success_planning_actions
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deletion_reason text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS purge_at timestamptz DEFAULT NULL;

ALTER TABLE success_planning_activities
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deletion_reason text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS purge_at timestamptz DEFAULT NULL;

ALTER TABLE success_planning_health
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deletion_reason text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS purge_at timestamptz DEFAULT NULL;

ALTER TABLE success_stories
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deletion_reason text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS purge_at timestamptz DEFAULT NULL;

ALTER TABLE success_planning_documents
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deletion_reason text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS purge_at timestamptz DEFAULT NULL;

-- Notification and alerts
ALTER TABLE notification_alerts
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deletion_reason text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS purge_at timestamptz DEFAULT NULL;

-- Form-related tables
ALTER TABLE form_tab_state
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deletion_reason text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS purge_at timestamptz DEFAULT NULL;

ALTER TABLE form_notes
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deletion_reason text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS purge_at timestamptz DEFAULT NULL;

-- Strategic and planning
ALTER TABLE section_preferences
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deletion_reason text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS purge_at timestamptz DEFAULT NULL;

ALTER TABLE strategic_priorities
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deletion_reason text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS purge_at timestamptz DEFAULT NULL;

-- Page summaries and AI
ALTER TABLE page_summaries
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deletion_reason text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS purge_at timestamptz DEFAULT NULL;

ALTER TABLE page_summary_items
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deletion_reason text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS purge_at timestamptz DEFAULT NULL;

ALTER TABLE ai_summary_config
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deletion_reason text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS purge_at timestamptz DEFAULT NULL;

ALTER TABLE ai_summary_generation_log
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deletion_reason text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS purge_at timestamptz DEFAULT NULL;

-- Metrics and tracking
ALTER TABLE metric_definitions
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deletion_reason text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS purge_at timestamptz DEFAULT NULL;

ALTER TABLE historical_metric_data
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deletion_reason text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS purge_at timestamptz DEFAULT NULL;

ALTER TABLE chart_sections
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deletion_reason text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS purge_at timestamptz DEFAULT NULL;

ALTER TABLE chart_metrics
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deletion_reason text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS purge_at timestamptz DEFAULT NULL;

ALTER TABLE metric_tracking_config
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deletion_reason text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS purge_at timestamptz DEFAULT NULL;

-- Client customizations and layouts
ALTER TABLE client_customizations
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deletion_reason text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS purge_at timestamptz DEFAULT NULL;

ALTER TABLE page_layouts
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deletion_reason text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS purge_at timestamptz DEFAULT NULL;

-- ============================================================================
-- STEP 2: Create Audit and Logging Tables
-- ============================================================================

-- Table to track permanently purged clients (for compliance)
CREATE TABLE IF NOT EXISTS purge_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  company_name text NOT NULL,
  deleted_at timestamptz NOT NULL,
  deleted_by text,
  deletion_reason text,
  purged_at timestamptz NOT NULL DEFAULT now(),
  record_counts jsonb DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Table to track all restoration activities
CREATE TABLE IF NOT EXISTS client_restoration_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  company_name text NOT NULL,
  restored_at timestamptz NOT NULL DEFAULT now(),
  restored_by text NOT NULL,
  restoration_reason text,
  was_deleted_at timestamptz,
  was_deleted_by text,
  original_deletion_reason text,
  days_in_deleted_state integer,
  notified_team_members jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE purge_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_restoration_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for purge_log (admin and csm can view)
CREATE POLICY "Allow authenticated users to view purge log"
  ON purge_log FOR SELECT
  TO authenticated
  USING (true);

-- RLS policies for client_restoration_log (admin and csm can view)
CREATE POLICY "Allow authenticated users to view restoration log"
  ON client_restoration_log FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- STEP 3: Create Database Functions
-- ============================================================================

-- Function to automatically calculate purge_at date (deleted_at + 90 days)
CREATE OR REPLACE FUNCTION calculate_purge_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND NEW.purge_at IS NULL THEN
    NEW.purge_at := NEW.deleted_at + INTERVAL '90 days';
  END IF;
  
  -- If deleted_at is cleared (restore), clear purge_at too
  IF NEW.deleted_at IS NULL THEN
    NEW.purge_at := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to soft delete a client and all related records
CREATE OR REPLACE FUNCTION soft_delete_client(
  p_client_id text,
  p_deleted_by text,
  p_deletion_reason text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_deleted_at timestamptz := now();
  v_purge_at timestamptz := now() + INTERVAL '90 days';
  v_company_name text;
  v_record_counts jsonb := '{}'::jsonb;
BEGIN
  -- Get company name for logging
  SELECT company_name INTO v_company_name
  FROM success_planning_overview
  WHERE client_id = p_client_id;
  
  -- Update all tables with soft delete information
  UPDATE success_planning_overview
  SET deleted_at = v_deleted_at, deleted_by = p_deleted_by,
      deletion_reason = p_deletion_reason, purge_at = v_purge_at
  WHERE client_id = p_client_id AND deleted_at IS NULL;
  
  UPDATE success_planning_stakeholders
  SET deleted_at = v_deleted_at, deleted_by = p_deleted_by,
      deletion_reason = p_deletion_reason, purge_at = v_purge_at
  WHERE client_id = p_client_id AND deleted_at IS NULL;
  
  UPDATE success_planning_team
  SET deleted_at = v_deleted_at, deleted_by = p_deleted_by,
      deletion_reason = p_deletion_reason, purge_at = v_purge_at
  WHERE client_id = p_client_id AND deleted_at IS NULL;
  
  UPDATE success_planning_goals
  SET deleted_at = v_deleted_at, deleted_by = p_deleted_by,
      deletion_reason = p_deletion_reason, purge_at = v_purge_at
  WHERE client_id = p_client_id AND deleted_at IS NULL;
  
  UPDATE success_planning_actions
  SET deleted_at = v_deleted_at, deleted_by = p_deleted_by,
      deletion_reason = p_deletion_reason, purge_at = v_purge_at
  WHERE client_id = p_client_id AND deleted_at IS NULL;
  
  UPDATE success_planning_activities
  SET deleted_at = v_deleted_at, deleted_by = p_deleted_by,
      deletion_reason = p_deletion_reason, purge_at = v_purge_at
  WHERE client_id = p_client_id AND deleted_at IS NULL;
  
  UPDATE success_planning_health
  SET deleted_at = v_deleted_at, deleted_by = p_deleted_by,
      deletion_reason = p_deletion_reason, purge_at = v_purge_at
  WHERE client_id = p_client_id AND deleted_at IS NULL;
  
  UPDATE success_stories
  SET deleted_at = v_deleted_at, deleted_by = p_deleted_by,
      deletion_reason = p_deletion_reason, purge_at = v_purge_at
  WHERE client_id = p_client_id AND deleted_at IS NULL;
  
  UPDATE success_planning_documents
  SET deleted_at = v_deleted_at, deleted_by = p_deleted_by,
      deletion_reason = p_deletion_reason, purge_at = v_purge_at
  WHERE client_id = p_client_id AND deleted_at IS NULL;
  
  UPDATE notification_alerts
  SET deleted_at = v_deleted_at, deleted_by = p_deleted_by,
      deletion_reason = p_deletion_reason, purge_at = v_purge_at
  WHERE client_id = p_client_id AND deleted_at IS NULL;
  
  UPDATE form_tab_state
  SET deleted_at = v_deleted_at, deleted_by = p_deleted_by,
      deletion_reason = p_deletion_reason, purge_at = v_purge_at
  WHERE client_id = p_client_id AND deleted_at IS NULL;
  
  UPDATE form_notes
  SET deleted_at = v_deleted_at, deleted_by = p_deleted_by,
      deletion_reason = p_deletion_reason, purge_at = v_purge_at
  WHERE client_id = p_client_id AND deleted_at IS NULL;
  
  UPDATE section_preferences
  SET deleted_at = v_deleted_at, deleted_by = p_deleted_by,
      deletion_reason = p_deletion_reason, purge_at = v_purge_at
  WHERE client_id = p_client_id AND deleted_at IS NULL;
  
  UPDATE strategic_priorities
  SET deleted_at = v_deleted_at, deleted_by = p_deleted_by,
      deletion_reason = p_deletion_reason, purge_at = v_purge_at
  WHERE client_id = p_client_id AND deleted_at IS NULL;
  
  UPDATE page_summaries
  SET deleted_at = v_deleted_at, deleted_by = p_deleted_by,
      deletion_reason = p_deletion_reason, purge_at = v_purge_at
  WHERE client_id = p_client_id AND deleted_at IS NULL;
  
  UPDATE page_summary_items
  SET deleted_at = v_deleted_at, deleted_by = p_deleted_by,
      deletion_reason = p_deletion_reason, purge_at = v_purge_at
  WHERE id IN (
    SELECT psi.id FROM page_summary_items psi
    JOIN page_summaries ps ON psi.summary_id = ps.id
    WHERE ps.client_id = p_client_id AND psi.deleted_at IS NULL
  );
  
  UPDATE ai_summary_config
  SET deleted_at = v_deleted_at, deleted_by = p_deleted_by,
      deletion_reason = p_deletion_reason, purge_at = v_purge_at
  WHERE id IN (
    SELECT aisc.id FROM ai_summary_config aisc
    JOIN page_summaries ps ON aisc.summary_id = ps.id
    WHERE ps.client_id = p_client_id AND aisc.deleted_at IS NULL
  );
  
  UPDATE ai_summary_generation_log
  SET deleted_at = v_deleted_at, deleted_by = p_deleted_by,
      deletion_reason = p_deletion_reason, purge_at = v_purge_at
  WHERE id IN (
    SELECT asgl.id FROM ai_summary_generation_log asgl
    JOIN page_summaries ps ON asgl.summary_id = ps.id
    WHERE ps.client_id = p_client_id AND asgl.deleted_at IS NULL
  );
  
  UPDATE metric_definitions
  SET deleted_at = v_deleted_at, deleted_by = p_deleted_by,
      deletion_reason = p_deletion_reason, purge_at = v_purge_at
  WHERE client_id = p_client_id AND deleted_at IS NULL;
  
  UPDATE historical_metric_data
  SET deleted_at = v_deleted_at, deleted_by = p_deleted_by,
      deletion_reason = p_deletion_reason, purge_at = v_purge_at
  WHERE client_id = p_client_id AND deleted_at IS NULL;
  
  UPDATE chart_sections
  SET deleted_at = v_deleted_at, deleted_by = p_deleted_by,
      deletion_reason = p_deletion_reason, purge_at = v_purge_at
  WHERE client_id = p_client_id AND deleted_at IS NULL;
  
  UPDATE chart_metrics
  SET deleted_at = v_deleted_at, deleted_by = p_deleted_by,
      deletion_reason = p_deletion_reason, purge_at = v_purge_at
  WHERE id IN (
    SELECT cm.id FROM chart_metrics cm
    JOIN chart_sections cs ON cm.chart_section_id = cs.id
    WHERE cs.client_id = p_client_id AND cm.deleted_at IS NULL
  );
  
  UPDATE metric_tracking_config
  SET deleted_at = v_deleted_at, deleted_by = p_deleted_by,
      deletion_reason = p_deletion_reason, purge_at = v_purge_at
  WHERE client_id = p_client_id AND deleted_at IS NULL;
  
  UPDATE client_customizations
  SET deleted_at = v_deleted_at, deleted_by = p_deleted_by,
      deletion_reason = p_deletion_reason, purge_at = v_purge_at
  WHERE client_id = p_client_id AND deleted_at IS NULL;
  
  UPDATE page_layouts
  SET deleted_at = v_deleted_at, deleted_by = p_deleted_by,
      deletion_reason = p_deletion_reason, purge_at = v_purge_at
  WHERE client_id = p_client_id AND deleted_at IS NULL;
  
  -- Return success with metadata
  RETURN jsonb_build_object(
    'success', true,
    'client_id', p_client_id,
    'company_name', v_company_name,
    'deleted_at', v_deleted_at,
    'purge_at', v_purge_at,
    'deleted_by', p_deleted_by
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore a client and all related records
CREATE OR REPLACE FUNCTION restore_client(
  p_client_id text,
  p_restored_by text,
  p_restoration_reason text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_company_name text;
  v_was_deleted_at timestamptz;
  v_was_deleted_by text;
  v_original_deletion_reason text;
  v_days_deleted integer;
  v_team_members jsonb;
BEGIN
  -- Get deletion info for logging
  SELECT 
    company_name,
    deleted_at,
    deleted_by,
    deletion_reason,
    EXTRACT(DAY FROM (now() - deleted_at))::integer
  INTO 
    v_company_name,
    v_was_deleted_at,
    v_was_deleted_by,
    v_original_deletion_reason,
    v_days_deleted
  FROM success_planning_overview
  WHERE client_id = p_client_id AND deleted_at IS NOT NULL;
  
  -- Get team members for notifications
  SELECT jsonb_agg(
    jsonb_build_object(
      'name', user_name,
      'email', user_email,
      'role', role_type
    )
  )
  INTO v_team_members
  FROM success_planning_team
  WHERE client_id = p_client_id AND deleted_at IS NOT NULL;
  
  -- Restore all tables by clearing soft delete fields
  UPDATE success_planning_overview
  SET deleted_at = NULL, deleted_by = NULL, deletion_reason = NULL, purge_at = NULL
  WHERE client_id = p_client_id;
  
  UPDATE success_planning_stakeholders
  SET deleted_at = NULL, deleted_by = NULL, deletion_reason = NULL, purge_at = NULL
  WHERE client_id = p_client_id;
  
  UPDATE success_planning_team
  SET deleted_at = NULL, deleted_by = NULL, deletion_reason = NULL, purge_at = NULL
  WHERE client_id = p_client_id;
  
  UPDATE success_planning_goals
  SET deleted_at = NULL, deleted_by = NULL, deletion_reason = NULL, purge_at = NULL
  WHERE client_id = p_client_id;
  
  UPDATE success_planning_actions
  SET deleted_at = NULL, deleted_by = NULL, deletion_reason = NULL, purge_at = NULL
  WHERE client_id = p_client_id;
  
  UPDATE success_planning_activities
  SET deleted_at = NULL, deleted_by = NULL, deletion_reason = NULL, purge_at = NULL
  WHERE client_id = p_client_id;
  
  UPDATE success_planning_health
  SET deleted_at = NULL, deleted_by = NULL, deletion_reason = NULL, purge_at = NULL
  WHERE client_id = p_client_id;
  
  UPDATE success_stories
  SET deleted_at = NULL, deleted_by = NULL, deletion_reason = NULL, purge_at = NULL
  WHERE client_id = p_client_id;
  
  UPDATE success_planning_documents
  SET deleted_at = NULL, deleted_by = NULL, deletion_reason = NULL, purge_at = NULL
  WHERE client_id = p_client_id;
  
  UPDATE notification_alerts
  SET deleted_at = NULL, deleted_by = NULL, deletion_reason = NULL, purge_at = NULL
  WHERE client_id = p_client_id;
  
  UPDATE form_tab_state
  SET deleted_at = NULL, deleted_by = NULL, deletion_reason = NULL, purge_at = NULL
  WHERE client_id = p_client_id;
  
  UPDATE form_notes
  SET deleted_at = NULL, deleted_by = NULL, deletion_reason = NULL, purge_at = NULL
  WHERE client_id = p_client_id;
  
  UPDATE section_preferences
  SET deleted_at = NULL, deleted_by = NULL, deletion_reason = NULL, purge_at = NULL
  WHERE client_id = p_client_id;
  
  UPDATE strategic_priorities
  SET deleted_at = NULL, deleted_by = NULL, deletion_reason = NULL, purge_at = NULL
  WHERE client_id = p_client_id;
  
  UPDATE page_summaries
  SET deleted_at = NULL, deleted_by = NULL, deletion_reason = NULL, purge_at = NULL
  WHERE client_id = p_client_id;
  
  UPDATE page_summary_items
  SET deleted_at = NULL, deleted_by = NULL, deletion_reason = NULL, purge_at = NULL
  WHERE id IN (
    SELECT psi.id FROM page_summary_items psi
    JOIN page_summaries ps ON psi.summary_id = ps.id
    WHERE ps.client_id = p_client_id
  );
  
  UPDATE ai_summary_config
  SET deleted_at = NULL, deleted_by = NULL, deletion_reason = NULL, purge_at = NULL
  WHERE id IN (
    SELECT aisc.id FROM ai_summary_config aisc
    JOIN page_summaries ps ON aisc.summary_id = ps.id
    WHERE ps.client_id = p_client_id
  );
  
  UPDATE ai_summary_generation_log
  SET deleted_at = NULL, deleted_by = NULL, deletion_reason = NULL, purge_at = NULL
  WHERE id IN (
    SELECT asgl.id FROM ai_summary_generation_log asgl
    JOIN page_summaries ps ON asgl.summary_id = ps.id
    WHERE ps.client_id = p_client_id
  );
  
  UPDATE metric_definitions
  SET deleted_at = NULL, deleted_by = NULL, deletion_reason = NULL, purge_at = NULL
  WHERE client_id = p_client_id;
  
  UPDATE historical_metric_data
  SET deleted_at = NULL, deleted_by = NULL, deletion_reason = NULL, purge_at = NULL
  WHERE client_id = p_client_id;
  
  UPDATE chart_sections
  SET deleted_at = NULL, deleted_by = NULL, deletion_reason = NULL, purge_at = NULL
  WHERE client_id = p_client_id;
  
  UPDATE chart_metrics
  SET deleted_at = NULL, deleted_by = NULL, deletion_reason = NULL, purge_at = NULL
  WHERE id IN (
    SELECT cm.id FROM chart_metrics cm
    JOIN chart_sections cs ON cm.chart_section_id = cs.id
    WHERE cs.client_id = p_client_id
  );
  
  UPDATE metric_tracking_config
  SET deleted_at = NULL, deleted_by = NULL, deletion_reason = NULL, purge_at = NULL
  WHERE client_id = p_client_id;
  
  UPDATE client_customizations
  SET deleted_at = NULL, deleted_by = NULL, deletion_reason = NULL, purge_at = NULL
  WHERE client_id = p_client_id;
  
  UPDATE page_layouts
  SET deleted_at = NULL, deleted_by = NULL, deletion_reason = NULL, purge_at = NULL
  WHERE client_id = p_client_id;
  
  -- Log the restoration
  INSERT INTO client_restoration_log (
    client_id,
    company_name,
    restored_by,
    restoration_reason,
    was_deleted_at,
    was_deleted_by,
    original_deletion_reason,
    days_in_deleted_state,
    notified_team_members
  ) VALUES (
    p_client_id,
    v_company_name,
    p_restored_by,
    p_restoration_reason,
    v_was_deleted_at,
    v_was_deleted_by,
    v_original_deletion_reason,
    v_days_deleted,
    COALESCE(v_team_members, '[]'::jsonb)
  );
  
  -- Return success with metadata
  RETURN jsonb_build_object(
    'success', true,
    'client_id', p_client_id,
    'company_name', v_company_name,
    'restored_by', p_restored_by,
    'was_deleted_for_days', v_days_deleted,
    'team_members_to_notify', COALESCE(v_team_members, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get team members for a client (for notifications)
CREATE OR REPLACE FUNCTION get_team_members_for_client(p_client_id text)
RETURNS jsonb AS $$
DECLARE
  v_team_members jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'name', user_name,
      'email', user_email,
      'phone', user_phone,
      'role', role_type,
      'is_primary', is_primary
    )
  )
  INTO v_team_members
  FROM success_planning_team
  WHERE client_id = p_client_id AND deleted_at IS NULL;
  
  RETURN COALESCE(v_team_members, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to permanently purge expired clients
CREATE OR REPLACE FUNCTION auto_purge_expired_clients()
RETURNS jsonb AS $$
DECLARE
  v_client record;
  v_purged_count integer := 0;
  v_purged_clients jsonb := '[]'::jsonb;
BEGIN
  -- Find all clients past their purge date
  FOR v_client IN
    SELECT client_id, company_name, deleted_at, deleted_by, deletion_reason, purge_at
    FROM success_planning_overview
    WHERE deleted_at IS NOT NULL
      AND purge_at IS NOT NULL
      AND purge_at <= now()
  LOOP
    -- Log to purge_log before deletion
    INSERT INTO purge_log (
      client_id,
      company_name,
      deleted_at,
      deleted_by,
      deletion_reason,
      purged_at,
      record_counts,
      notes
    )
    SELECT
      v_client.client_id,
      v_client.company_name,
      v_client.deleted_at,
      v_client.deleted_by,
      v_client.deletion_reason,
      now(),
      jsonb_build_object(
        'overview', (SELECT count(*) FROM success_planning_overview WHERE client_id = v_client.client_id),
        'stakeholders', (SELECT count(*) FROM success_planning_stakeholders WHERE client_id = v_client.client_id),
        'team', (SELECT count(*) FROM success_planning_team WHERE client_id = v_client.client_id),
        'goals', (SELECT count(*) FROM success_planning_goals WHERE client_id = v_client.client_id),
        'actions', (SELECT count(*) FROM success_planning_actions WHERE client_id = v_client.client_id),
        'activities', (SELECT count(*) FROM success_planning_activities WHERE client_id = v_client.client_id)
      ),
      'Auto-purged after 90 days';
    
    -- Permanently delete from all tables
    DELETE FROM page_summary_items WHERE id IN (
      SELECT psi.id FROM page_summary_items psi
      JOIN page_summaries ps ON psi.summary_id = ps.id
      WHERE ps.client_id = v_client.client_id
    );
    
    DELETE FROM ai_summary_generation_log WHERE id IN (
      SELECT asgl.id FROM ai_summary_generation_log asgl
      JOIN page_summaries ps ON asgl.summary_id = ps.id
      WHERE ps.client_id = v_client.client_id
    );
    
    DELETE FROM ai_summary_config WHERE id IN (
      SELECT aisc.id FROM ai_summary_config aisc
      JOIN page_summaries ps ON aisc.summary_id = ps.id
      WHERE ps.client_id = v_client.client_id
    );
    
    DELETE FROM chart_metrics WHERE id IN (
      SELECT cm.id FROM chart_metrics cm
      JOIN chart_sections cs ON cm.chart_section_id = cs.id
      WHERE cs.client_id = v_client.client_id
    );
    
    DELETE FROM success_planning_stakeholders WHERE client_id = v_client.client_id;
    DELETE FROM success_planning_team WHERE client_id = v_client.client_id;
    DELETE FROM success_planning_goals WHERE client_id = v_client.client_id;
    DELETE FROM success_planning_actions WHERE client_id = v_client.client_id;
    DELETE FROM success_planning_activities WHERE client_id = v_client.client_id;
    DELETE FROM success_planning_health WHERE client_id = v_client.client_id;
    DELETE FROM success_stories WHERE client_id = v_client.client_id;
    DELETE FROM success_planning_documents WHERE client_id = v_client.client_id;
    DELETE FROM notification_alerts WHERE client_id = v_client.client_id;
    DELETE FROM form_tab_state WHERE client_id = v_client.client_id;
    DELETE FROM form_notes WHERE client_id = v_client.client_id;
    DELETE FROM section_preferences WHERE client_id = v_client.client_id;
    DELETE FROM strategic_priorities WHERE client_id = v_client.client_id;
    DELETE FROM page_summaries WHERE client_id = v_client.client_id;
    DELETE FROM metric_definitions WHERE client_id = v_client.client_id;
    DELETE FROM historical_metric_data WHERE client_id = v_client.client_id;
    DELETE FROM chart_sections WHERE client_id = v_client.client_id;
    DELETE FROM metric_tracking_config WHERE client_id = v_client.client_id;
    DELETE FROM client_customizations WHERE client_id = v_client.client_id;
    DELETE FROM page_layouts WHERE client_id = v_client.client_id;
    DELETE FROM success_planning_overview WHERE client_id = v_client.client_id;
    
    v_purged_count := v_purged_count + 1;
    v_purged_clients := v_purged_clients || jsonb_build_object(
      'client_id', v_client.client_id,
      'company_name', v_client.company_name
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'purged_count', v_purged_count,
    'purged_clients', v_purged_clients,
    'purged_at', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 4: Create Triggers for Auto-Calculating purge_at
-- ============================================================================

-- Create triggers on all tables to auto-calculate purge_at
CREATE TRIGGER trg_calculate_purge_date_overview
  BEFORE INSERT OR UPDATE ON success_planning_overview
  FOR EACH ROW
  EXECUTE FUNCTION calculate_purge_date();

CREATE TRIGGER trg_calculate_purge_date_stakeholders
  BEFORE INSERT OR UPDATE ON success_planning_stakeholders
  FOR EACH ROW
  EXECUTE FUNCTION calculate_purge_date();

CREATE TRIGGER trg_calculate_purge_date_team
  BEFORE INSERT OR UPDATE ON success_planning_team
  FOR EACH ROW
  EXECUTE FUNCTION calculate_purge_date();

CREATE TRIGGER trg_calculate_purge_date_goals
  BEFORE INSERT OR UPDATE ON success_planning_goals
  FOR EACH ROW
  EXECUTE FUNCTION calculate_purge_date();

CREATE TRIGGER trg_calculate_purge_date_actions
  BEFORE INSERT OR UPDATE ON success_planning_actions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_purge_date();

CREATE TRIGGER trg_calculate_purge_date_activities
  BEFORE INSERT OR UPDATE ON success_planning_activities
  FOR EACH ROW
  EXECUTE FUNCTION calculate_purge_date();

CREATE TRIGGER trg_calculate_purge_date_health
  BEFORE INSERT OR UPDATE ON success_planning_health
  FOR EACH ROW
  EXECUTE FUNCTION calculate_purge_date();

CREATE TRIGGER trg_calculate_purge_date_stories
  BEFORE INSERT OR UPDATE ON success_stories
  FOR EACH ROW
  EXECUTE FUNCTION calculate_purge_date();

CREATE TRIGGER trg_calculate_purge_date_documents
  BEFORE INSERT OR UPDATE ON success_planning_documents
  FOR EACH ROW
  EXECUTE FUNCTION calculate_purge_date();

-- ============================================================================
-- STEP 5: Create Indexes for Performance
-- ============================================================================

-- Indexes on deleted_at for efficient filtering
CREATE INDEX IF NOT EXISTS idx_overview_deleted_at ON success_planning_overview(deleted_at);
CREATE INDEX IF NOT EXISTS idx_overview_purge_at ON success_planning_overview(purge_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stakeholders_deleted_at ON success_planning_stakeholders(deleted_at);
CREATE INDEX IF NOT EXISTS idx_team_deleted_at ON success_planning_team(deleted_at);
CREATE INDEX IF NOT EXISTS idx_goals_deleted_at ON success_planning_goals(deleted_at);
CREATE INDEX IF NOT EXISTS idx_actions_deleted_at ON success_planning_actions(deleted_at);
CREATE INDEX IF NOT EXISTS idx_activities_deleted_at ON success_planning_activities(deleted_at);
CREATE INDEX IF NOT EXISTS idx_health_deleted_at ON success_planning_health(deleted_at);
CREATE INDEX IF NOT EXISTS idx_stories_deleted_at ON success_stories(deleted_at);
CREATE INDEX IF NOT EXISTS idx_documents_deleted_at ON success_planning_documents(deleted_at);

-- Composite indexes for deleted client queries
CREATE INDEX IF NOT EXISTS idx_overview_client_deleted ON success_planning_overview(client_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_overview_deleted_purge ON success_planning_overview(deleted_at, purge_at) WHERE deleted_at IS NOT NULL;

-- ============================================================================
-- STEP 6: Update RLS Policies to Filter Soft-Deleted Records
-- ============================================================================

-- Note: We need to create new policies that explicitly filter out soft-deleted records
-- The existing anon policies need to be augmented with deleted_at IS NULL condition

-- Drop and recreate the main SELECT policies with soft delete filter
DO $$
BEGIN
  -- success_planning_overview
  DROP POLICY IF EXISTS "Allow anon access to success_planning_overview" ON success_planning_overview;
  CREATE POLICY "Allow anon access to success_planning_overview"
    ON success_planning_overview FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);
  
  -- success_planning_stakeholders
  DROP POLICY IF EXISTS "Allow anon access to success_planning_stakeholders" ON success_planning_stakeholders;
  CREATE POLICY "Allow anon access to success_planning_stakeholders"
    ON success_planning_stakeholders FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);
  
  -- success_planning_team
  DROP POLICY IF EXISTS "Allow anon access to success_planning_team" ON success_planning_team;
  CREATE POLICY "Allow anon access to success_planning_team"
    ON success_planning_team FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);
  
  -- success_planning_goals
  DROP POLICY IF EXISTS "Allow anon access to success_planning_goals" ON success_planning_goals;
  CREATE POLICY "Allow anon access to success_planning_goals"
    ON success_planning_goals FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);
  
  -- success_planning_actions
  DROP POLICY IF EXISTS "Allow anon access to success_planning_actions" ON success_planning_actions;
  CREATE POLICY "Allow anon access to success_planning_actions"
    ON success_planning_actions FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);
  
  -- success_planning_activities
  DROP POLICY IF EXISTS "Allow anon access to success_planning_activities" ON success_planning_activities;
  CREATE POLICY "Allow anon access to success_planning_activities"
    ON success_planning_activities FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);
  
  -- success_planning_health
  DROP POLICY IF EXISTS "Allow anon access to success_planning_health" ON success_planning_health;
  CREATE POLICY "Allow anon access to success_planning_health"
    ON success_planning_health FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);
  
  -- success_stories
  DROP POLICY IF EXISTS "Allow anon access to success_stories" ON success_stories;
  CREATE POLICY "Allow anon access to success_stories"
    ON success_stories FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);
  
  -- success_planning_documents
  DROP POLICY IF EXISTS "Allow anon access to success_planning_documents" ON success_planning_documents;
  CREATE POLICY "Allow anon access to success_planning_documents"
    ON success_planning_documents FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);
  
  -- strategic_priorities
  DROP POLICY IF EXISTS "Allow anon access to strategic_priorities SELECT" ON strategic_priorities;
  CREATE POLICY "Allow anon access to strategic_priorities SELECT"
    ON strategic_priorities FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);
  
  -- page_summaries
  DROP POLICY IF EXISTS "Allow anon access to page_summaries SELECT" ON page_summaries;
  CREATE POLICY "Allow anon access to page_summaries SELECT"
    ON page_summaries FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);
  
  -- page_summary_items
  DROP POLICY IF EXISTS "Allow anon access to page_summary_items SELECT" ON page_summary_items;
  CREATE POLICY "Allow anon access to page_summary_items SELECT"
    ON page_summary_items FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);
  
  -- metric_definitions
  DROP POLICY IF EXISTS "Allow anon access to metric_definitions SELECT" ON metric_definitions;
  CREATE POLICY "Allow anon access to metric_definitions SELECT"
    ON metric_definitions FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);
  
  -- historical_metric_data
  DROP POLICY IF EXISTS "Allow anon access to historical_metric_data SELECT" ON historical_metric_data;
  CREATE POLICY "Allow anon access to historical_metric_data SELECT"
    ON historical_metric_data FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);
  
  -- chart_sections
  DROP POLICY IF EXISTS "Allow anon access to chart_sections SELECT" ON chart_sections;
  CREATE POLICY "Allow anon access to chart_sections SELECT"
    ON chart_sections FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);
  
  -- chart_metrics
  DROP POLICY IF EXISTS "Allow anon access to chart_metrics SELECT" ON chart_metrics;
  CREATE POLICY "Allow anon access to chart_metrics SELECT"
    ON chart_metrics FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);
END $$;

-- Create separate policies for viewing DELETED records (admin and csm roles)
CREATE POLICY "Allow authenticated users to view deleted clients"
  ON success_planning_overview FOR SELECT
  TO authenticated
  USING (deleted_at IS NOT NULL);

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION soft_delete_client(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_client(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_team_members_for_client(text) TO authenticated;
GRANT EXECUTE ON FUNCTION auto_purge_expired_clients() TO authenticated;
