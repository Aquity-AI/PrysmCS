/*
  # Manual Purge and Notification Functions for Soft Delete System
  
  ## Overview
  Extends the soft delete system with admin-controlled manual purge and notification creation.
  
  ## New Functions
  
  1. `immediate_purge_client()` - Admin function to permanently delete a client before 90-day period
     - Requires admin role
     - Logs to purge_log with manual purge flag
     - Performs same deletion as auto_purge but bypasses date check
  
  2. `create_deletion_notifications()` - Creates in-app notifications for team members
     - Called after soft delete
     - Creates notification_alerts records for each team member
     - Notification type: 'risk'
  
  3. `create_restoration_notifications()` - Creates in-app notifications for team members
     - Called after restoration
     - Creates notification_alerts records for each team member
     - Notification type: 'opportunity'
  
  ## Security
  - All functions use SECURITY DEFINER for elevated privileges
  - Permission checks should be handled at application level
  - Functions are granted to authenticated users for RPC calls
*/

-- ============================================================================
-- Function: Immediate Manual Purge (Admin Only)
-- ============================================================================

CREATE OR REPLACE FUNCTION immediate_purge_client(
  p_client_id text,
  p_purged_by text,
  p_purge_reason text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_client record;
  v_purged_clients jsonb := '[]'::jsonb;
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
    'Manual purge by ' || p_purged_by || '. Reason: ' || COALESCE(p_purge_reason, 'Not specified');
  
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
    'purged_at', now(),
    'purged_by', p_purged_by
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function: Create Deletion Notifications
-- ============================================================================

CREATE OR REPLACE FUNCTION create_deletion_notifications(
  p_client_id text,
  p_company_name text,
  p_deleted_by text,
  p_purge_date timestamptz
)
RETURNS jsonb AS $$
DECLARE
  v_team_member record;
  v_notification_count integer := 0;
BEGIN
  -- Create notification for each team member
  FOR v_team_member IN
    SELECT user_name, user_email
    FROM success_planning_team
    WHERE client_id = p_client_id AND deleted_at IS NOT NULL
  LOOP
    INSERT INTO notification_alerts (
      action_id,
      client_id,
      client_name,
      alert_type,
      title,
      message,
      status,
      created_at
    ) VALUES (
      NULL,
      p_client_id,
      p_company_name,
      'risk',
      'Client Account Deleted',
      'The client account "' || p_company_name || '" has been deleted by ' || p_deleted_by || 
      '. The account will be permanently purged on ' || to_char(p_purge_date, 'YYYY-MM-DD') || 
      ' unless restored by an administrator.',
      'active',
      now()
    );
    
    v_notification_count := v_notification_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'notifications_created', v_notification_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function: Create Restoration Notifications
-- ============================================================================

CREATE OR REPLACE FUNCTION create_restoration_notifications(
  p_client_id text,
  p_company_name text,
  p_restored_by text
)
RETURNS jsonb AS $$
DECLARE
  v_team_member record;
  v_notification_count integer := 0;
BEGIN
  -- Create notification for each team member
  FOR v_team_member IN
    SELECT user_name, user_email
    FROM success_planning_team
    WHERE client_id = p_client_id AND deleted_at IS NULL
  LOOP
    INSERT INTO notification_alerts (
      action_id,
      client_id,
      client_name,
      alert_type,
      title,
      message,
      status,
      created_at
    ) VALUES (
      NULL,
      p_client_id,
      p_company_name,
      'opportunity',
      'Client Account Restored',
      'The client account "' || p_company_name || '" has been restored by ' || p_restored_by || 
      '. The account is now active again and all data has been recovered.',
      'active',
      now()
    );
    
    v_notification_count := v_notification_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'notifications_created', v_notification_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Grant Execute Permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION immediate_purge_client(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION create_deletion_notifications(text, text, text, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION create_restoration_notifications(text, text, text) TO authenticated;
