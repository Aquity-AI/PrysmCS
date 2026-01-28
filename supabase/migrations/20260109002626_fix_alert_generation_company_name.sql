/*
  # Fix Alert Generation to Use company_name

  ## Overview
  Updates the generate_alert_for_overdue_action function to use the correct
  column name (company_name) from success_planning_overview instead of client_name.

  ## Changes
  - Update query to select company_name instead of client_name
  - Fallback to client_id if company_name is NULL
*/

-- ============================================================================
-- FUNCTION: Generate Alert for Overdue Action (Fixed)
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_alert_for_overdue_action(p_action_id uuid)
RETURNS uuid AS $$
DECLARE
  v_action_record RECORD;
  v_client_name text;
  v_alert_type text;
  v_alert_id uuid;
  v_existing_alert_count integer;
BEGIN
  -- Check if active alert already exists for this action
  SELECT COUNT(*)
  INTO v_existing_alert_count
  FROM notification_alerts
  WHERE action_id = p_action_id
    AND status = 'active';
  
  -- Don't create duplicate alerts
  IF v_existing_alert_count > 0 THEN
    RETURN NULL;
  END IF;
  
  -- Fetch action details
  SELECT 
    a.id,
    a.client_id,
    a.title,
    a.action_type,
    a.due_date,
    a.status
  INTO v_action_record
  FROM success_planning_actions a
  WHERE a.id = p_action_id;
  
  -- Return NULL if action doesn't exist or is not overdue
  IF v_action_record IS NULL THEN
    RETURN NULL;
  END IF;
  
  IF v_action_record.status = 'Completed' OR 
     v_action_record.due_date IS NULL OR 
     v_action_record.due_date >= CURRENT_DATE THEN
    RETURN NULL;
  END IF;
  
  -- Get company name (use company_name column, not client_name)
  SELECT company_name
  INTO v_client_name
  FROM success_planning_overview
  WHERE client_id = v_action_record.client_id;
  
  -- Default to client_id if company name not found
  IF v_client_name IS NULL OR v_client_name = '' THEN
    v_client_name := v_action_record.client_id;
  END IF;
  
  -- Determine alert type based on action type
  CASE v_action_record.action_type
    WHEN 'Risk' THEN v_alert_type := 'risk';
    WHEN 'Opportunity' THEN v_alert_type := 'opportunity';
    ELSE v_alert_type := 'overdue';
  END CASE;
  
  -- Create the alert
  INSERT INTO notification_alerts (
    action_id,
    client_id,
    client_name,
    alert_type,
    title,
    message,
    status,
    created_at
  )
  VALUES (
    p_action_id,
    v_action_record.client_id,
    v_client_name,
    v_alert_type,
    'Overdue: ' || v_action_record.title,
    format_alert_message(v_client_name, v_action_record.action_type, v_action_record.due_date),
    'active',
    NOW()
  )
  RETURNING id INTO v_alert_id;
  
  RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
