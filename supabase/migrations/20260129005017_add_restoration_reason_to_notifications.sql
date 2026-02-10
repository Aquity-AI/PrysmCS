/*
  # Add Restoration Reason to Notifications

  ## Overview
  Updates the restoration notification function to include the restoration reason
  in the notification message so team members understand why the account was restored.

  ## Changes
  1. Updates `create_restoration_notifications()` to accept restoration reason parameter
  2. Includes the restoration reason in the notification message

  ## Security
  - Function uses SECURITY DEFINER for elevated privileges
  - Permission checks handled at application level
*/

-- ============================================================================
-- Function: Create Restoration Notifications (Updated with Reason)
-- ============================================================================

CREATE OR REPLACE FUNCTION create_restoration_notifications(
  p_client_id text,
  p_company_name text,
  p_restored_by text,
  p_restoration_reason text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_team_member record;
  v_notification_count integer := 0;
  v_reason_text text;
BEGIN
  -- Format reason text
  v_reason_text := CASE
    WHEN p_restoration_reason IS NOT NULL AND length(trim(p_restoration_reason)) > 0
    THEN ' Reason: ' || p_restoration_reason
    ELSE ''
  END;

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
      '. The account is now active again and all data has been recovered.' || v_reason_text,
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_restoration_notifications(text, text, text, text) TO authenticated;