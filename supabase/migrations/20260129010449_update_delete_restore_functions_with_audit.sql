/*
  # Update Soft Delete and Restore Functions to Log Audit Events

  ## Changes
  - Modify soft_delete_client() to log CLIENT_DELETED audit event
  - Modify restore_client() to log CLIENT_RESTORED audit event
  - Both functions now call log_audit_event() helper for consistent audit logging
*/

-- ============================================================================
-- Update soft_delete_client() to log audit events
-- ============================================================================

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
  v_audit_id uuid;
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
  
  -- Log audit event for CLIENT_DELETED
  v_audit_id := log_audit_event(
    p_action := 'CLIENT_DELETED',
    p_user_email := p_deleted_by,
    p_user_name := p_deleted_by,
    p_user_role := 'admin',
    p_client_id := p_client_id,
    p_client_name := v_company_name,
    p_details := jsonb_build_object(
      'deletion_reason', COALESCE(p_deletion_reason, 'No reason provided'),
      'purge_at', v_purge_at
    ),
    p_resource := 'client_account'
  );
  
  -- Return success with metadata
  RETURN jsonb_build_object(
    'success', true,
    'client_id', p_client_id,
    'company_name', v_company_name,
    'deleted_at', v_deleted_at,
    'purge_at', v_purge_at,
    'deleted_by', p_deleted_by,
    'audit_id', v_audit_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Update restore_client() to log audit events
-- ============================================================================

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
  v_restoration_id uuid;
  v_audit_id uuid;
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
  
  -- Log the restoration to client_restoration_log
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
    v_team_members
  )
  RETURNING id INTO v_restoration_id;
  
  -- Log audit event for CLIENT_RESTORED
  v_audit_id := log_audit_event(
    p_action := 'CLIENT_RESTORED',
    p_user_email := p_restored_by,
    p_user_name := p_restored_by,
    p_user_role := 'admin',
    p_client_id := p_client_id,
    p_client_name := v_company_name,
    p_details := jsonb_build_object(
      'restoration_reason', COALESCE(p_restoration_reason, 'No reason provided'),
      'was_deleted_at', v_was_deleted_at,
      'was_deleted_by', v_was_deleted_by,
      'original_deletion_reason', COALESCE(v_original_deletion_reason, 'No reason provided'),
      'days_in_deleted_state', v_days_deleted
    ),
    p_resource := 'client_account'
  );
  
  -- Return success with metadata
  RETURN jsonb_build_object(
    'success', true,
    'client_id', p_client_id,
    'company_name', v_company_name,
    'restored_by', p_restored_by,
    'restoration_reason', p_restoration_reason,
    'was_deleted_for_days', v_days_deleted,
    'restoration_id', v_restoration_id,
    'audit_id', v_audit_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;