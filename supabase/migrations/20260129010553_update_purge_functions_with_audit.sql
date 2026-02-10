/*
  # Update Purge Functions to Log Audit Events

  ## Changes
  - Modify auto_purge_expired_clients() to log CLIENT_PURGED audit events
  - Modify immediate_purge_client() to log CLIENT_PURGED audit events
  - Both functions now call log_audit_event() for consistent audit logging
*/

-- ============================================================================
-- Update auto_purge_expired_clients() to log audit events
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_purge_expired_clients()
RETURNS jsonb AS $$
DECLARE
  v_client record;
  v_purged_count integer := 0;
  v_purged_clients jsonb := '[]'::jsonb;
  v_record_counts jsonb;
  v_audit_id uuid;
BEGIN
  -- Find all clients past their purge date
  FOR v_client IN
    SELECT client_id, company_name, deleted_at, deleted_by, deletion_reason, purge_at
    FROM success_planning_overview
    WHERE deleted_at IS NOT NULL
      AND purge_at IS NOT NULL
      AND purge_at <= now()
  LOOP
    -- Calculate record counts before deletion
    v_record_counts := jsonb_build_object(
      'overview', (SELECT count(*) FROM success_planning_overview WHERE client_id = v_client.client_id),
      'stakeholders', (SELECT count(*) FROM success_planning_stakeholders WHERE client_id = v_client.client_id),
      'team', (SELECT count(*) FROM success_planning_team WHERE client_id = v_client.client_id),
      'goals', (SELECT count(*) FROM success_planning_goals WHERE client_id = v_client.client_id),
      'actions', (SELECT count(*) FROM success_planning_actions WHERE client_id = v_client.client_id),
      'activities', (SELECT count(*) FROM success_planning_activities WHERE client_id = v_client.client_id)
    );
  
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
    ) VALUES (
      v_client.client_id,
      v_client.company_name,
      v_client.deleted_at,
      v_client.deleted_by,
      v_client.deletion_reason,
      now(),
      v_record_counts,
      'Auto-purged after 90 days'
    );
    
    -- Log audit event for CLIENT_PURGED (before deletion)
    v_audit_id := log_audit_event(
      p_action := 'CLIENT_PURGED',
      p_user_email := 'system',
      p_user_name := 'System',
      p_user_role := 'system',
      p_client_id := v_client.client_id,
      p_client_name := v_client.company_name,
      p_details := jsonb_build_object(
        'purge_type', 'automatic',
        'original_deletion_reason', COALESCE(v_client.deletion_reason, 'No reason provided'),
        'deleted_at', v_client.deleted_at,
        'deleted_by', v_client.deleted_by,
        'record_counts', v_record_counts,
        'days_since_deletion', EXTRACT(DAY FROM (now() - v_client.deleted_at))::integer
      ),
      p_resource := 'client_account'
    );
    
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
      'company_name', v_client.company_name,
      'audit_id', v_audit_id
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
-- Update immediate_purge_client() to log audit events
-- ============================================================================

CREATE OR REPLACE FUNCTION immediate_purge_client(
  p_client_id text,
  p_purged_by text,
  p_purge_reason text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_client record;
  v_record_counts jsonb;
  v_audit_id uuid;
BEGIN
  -- Get client info before deletion
  SELECT client_id, company_name, deleted_at, deleted_by, deletion_reason, purge_at
  INTO v_client
  FROM success_planning_overview
  WHERE client_id = p_client_id AND deleted_at IS NOT NULL;
  
  -- If client not found or not deleted, return error
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Client not found or not in deleted state'
    );
  END IF;
  
  -- Calculate record counts before deletion
  v_record_counts := jsonb_build_object(
    'overview', (SELECT count(*) FROM success_planning_overview WHERE client_id = v_client.client_id),
    'stakeholders', (SELECT count(*) FROM success_planning_stakeholders WHERE client_id = v_client.client_id),
    'team', (SELECT count(*) FROM success_planning_team WHERE client_id = v_client.client_id),
    'goals', (SELECT count(*) FROM success_planning_goals WHERE client_id = v_client.client_id),
    'actions', (SELECT count(*) FROM success_planning_actions WHERE client_id = v_client.client_id),
    'activities', (SELECT count(*) FROM success_planning_activities WHERE client_id = v_client.client_id)
  );
  
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
  ) VALUES (
    v_client.client_id,
    v_client.company_name,
    v_client.deleted_at,
    v_client.deleted_by,
    v_client.deletion_reason,
    now(),
    v_record_counts,
    'Manual purge by ' || p_purged_by || '. Reason: ' || COALESCE(p_purge_reason, 'Not specified')
  );
  
  -- Log audit event for CLIENT_PURGED (before deletion)
  v_audit_id := log_audit_event(
    p_action := 'CLIENT_PURGED',
    p_user_email := p_purged_by,
    p_user_name := p_purged_by,
    p_user_role := 'admin',
    p_client_id := v_client.client_id,
    p_client_name := v_client.company_name,
    p_details := jsonb_build_object(
      'purge_type', 'manual',
      'purge_reason', COALESCE(p_purge_reason, 'Not specified'),
      'original_deletion_reason', COALESCE(v_client.deletion_reason, 'No reason provided'),
      'deleted_at', v_client.deleted_at,
      'deleted_by', v_client.deleted_by,
      'record_counts', v_record_counts,
      'days_since_deletion', EXTRACT(DAY FROM (now() - v_client.deleted_at))::integer
    ),
    p_resource := 'client_account'
  );
  
  -- Permanently delete from all tables (same as auto_purge)
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
  
  RETURN jsonb_build_object(
    'success', true,
    'client_id', v_client.client_id,
    'company_name', v_client.company_name,
    'purged_by', p_purged_by,
    'purged_at', now(),
    'audit_id', v_audit_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;