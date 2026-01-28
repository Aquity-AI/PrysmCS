/*
  # Create Alert Generation and Cleanup Functions

  ## Overview
  This migration creates database functions to automatically generate and manage
  notification alerts for overdue action items. These functions are called by
  triggers to ensure real-time alert creation and cleanup.

  ## New Functions

  1. `generate_alert_for_overdue_action(action_id uuid)`
     - Creates a notification alert for an overdue action item
     - Fetches client name from success_planning_overview for display
     - Prevents duplicate alerts by checking for existing active alerts
     - Sets alert type based on action type (Risk → 'risk', Opportunity → 'opportunity', else → 'overdue')
     - Returns the alert ID or NULL if alert already exists

  2. `cleanup_resolved_alerts(action_id uuid)`
     - Automatically dismisses alerts when action is completed or no longer overdue
     - Updates alert status to 'dismissed' with timestamp
     - Called when action status changes to 'Completed' or due_date moves to future

  3. `format_alert_message(client_name text, action_type text, due_date date)`
     - Helper function to generate consistent alert messages
     - Returns formatted message string

  ## Security
  - All functions use SECURITY DEFINER for RLS compatibility
  - Functions validate input parameters
  - Proper NULL handling for optional fields
*/

-- ============================================================================
-- FUNCTION: Format Alert Message
-- ============================================================================
CREATE OR REPLACE FUNCTION format_alert_message(
  p_client_name text,
  p_action_type text,
  p_due_date date
)
RETURNS text AS $$
DECLARE
  v_days_overdue integer;
BEGIN
  v_days_overdue := CURRENT_DATE - p_due_date;
  
  RETURN p_client_name || ' - ' || p_action_type || ' item overdue by ' || 
         v_days_overdue || ' day' || 
         CASE WHEN v_days_overdue != 1 THEN 's' ELSE '' END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- FUNCTION: Generate Alert for Overdue Action
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
  
  -- Get client name
  SELECT client_name
  INTO v_client_name
  FROM success_planning_overview
  WHERE client_id = v_action_record.client_id;
  
  -- Default to client_id if name not found
  IF v_client_name IS NULL THEN
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

-- ============================================================================
-- FUNCTION: Cleanup Resolved Alerts
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_resolved_alerts(p_action_id uuid)
RETURNS void AS $$
BEGIN
  -- Dismiss any active alerts for this action
  UPDATE notification_alerts
  SET 
    status = 'dismissed',
    dismissed_at = NOW()
  WHERE action_id = p_action_id
    AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Check if Action is Overdue
-- ============================================================================
CREATE OR REPLACE FUNCTION is_action_overdue(
  p_status text,
  p_due_date date
)
RETURNS boolean AS $$
BEGIN
  RETURN p_status != 'Completed' 
    AND p_due_date IS NOT NULL 
    AND p_due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
