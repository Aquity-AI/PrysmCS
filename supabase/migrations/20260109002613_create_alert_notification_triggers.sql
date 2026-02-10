/*
  # Create Alert Notification Triggers

  ## Overview
  This migration creates database triggers that automatically generate and manage
  notification alerts when action items become overdue or are resolved. The triggers
  ensure real-time alert creation without manual intervention.

  ## New Triggers

  1. `trg_check_and_create_overdue_alerts`
     - Fires AFTER INSERT OR UPDATE on success_planning_actions
     - Creates alert when action becomes overdue
     - Dismisses alert when action is completed or no longer overdue
     - Only processes when relevant fields change (status, due_date, completed_at)

  ## How It Works

  ### When Action Becomes Overdue
  - Action has status != 'Completed'
  - AND due_date < CURRENT_DATE
  - → Calls generate_alert_for_overdue_action()

  ### When Action is Resolved
  - Action status changes to 'Completed'
  - OR due_date moves to future or becomes NULL
  - → Calls cleanup_resolved_alerts()

  ## Performance
  - Conditional logic prevents unnecessary function calls
  - Only fires on relevant column changes
  - Uses existing indexes for fast queries
*/

-- ============================================================================
-- TRIGGER FUNCTION: Check and Create/Dismiss Alerts for Overdue Actions
-- ============================================================================
CREATE OR REPLACE FUNCTION trg_check_and_create_overdue_alerts()
RETURNS TRIGGER AS $$
DECLARE
  v_is_now_overdue boolean;
  v_was_overdue boolean;
BEGIN
  -- Determine if action is currently overdue
  v_is_now_overdue := is_action_overdue(NEW.status, NEW.due_date);
  
  -- For updates, check if it was previously overdue
  IF TG_OP = 'UPDATE' THEN
    v_was_overdue := is_action_overdue(OLD.status, OLD.due_date);
    
    -- Case 1: Action just became overdue
    IF v_is_now_overdue AND NOT v_was_overdue THEN
      PERFORM generate_alert_for_overdue_action(NEW.id);
    
    -- Case 2: Action is no longer overdue (completed or due date changed)
    ELSIF NOT v_is_now_overdue AND v_was_overdue THEN
      PERFORM cleanup_resolved_alerts(NEW.id);
    
    -- Case 3: Action is still overdue but details changed
    -- Dismiss old alert and create new one with updated info
    ELSIF v_is_now_overdue AND v_was_overdue THEN
      IF (OLD.title IS DISTINCT FROM NEW.title OR 
          OLD.action_type IS DISTINCT FROM NEW.action_type OR 
          OLD.due_date IS DISTINCT FROM NEW.due_date) THEN
        PERFORM cleanup_resolved_alerts(NEW.id);
        PERFORM generate_alert_for_overdue_action(NEW.id);
      END IF;
    END IF;
    
  -- For inserts, just check if it's overdue
  ELSIF TG_OP = 'INSERT' THEN
    IF v_is_now_overdue THEN
      PERFORM generate_alert_for_overdue_action(NEW.id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CREATE TRIGGER: Overdue Action Alerts
-- ============================================================================
DROP TRIGGER IF EXISTS trg_check_and_create_overdue_alerts ON success_planning_actions;

CREATE TRIGGER trg_check_and_create_overdue_alerts
  AFTER INSERT OR UPDATE OF status, due_date, completed_at, title, action_type
  ON success_planning_actions
  FOR EACH ROW
  EXECUTE FUNCTION trg_check_and_create_overdue_alerts();

-- ============================================================================
-- TRIGGER FUNCTION: Update Alert Client Name When Overview Changes
-- ============================================================================
CREATE OR REPLACE FUNCTION trg_update_alert_company_names()
RETURNS TRIGGER AS $$
BEGIN
  -- When company name changes in overview, update all active alerts
  IF TG_OP = 'UPDATE' AND OLD.company_name IS DISTINCT FROM NEW.company_name THEN
    UPDATE notification_alerts
    SET 
      client_name = COALESCE(NEW.company_name, NEW.client_id),
      message = format_alert_message(
        COALESCE(NEW.company_name, NEW.client_id),
        (SELECT action_type FROM success_planning_actions WHERE id = notification_alerts.action_id),
        (SELECT due_date FROM success_planning_actions WHERE id = notification_alerts.action_id)
      )
    WHERE client_id = NEW.client_id
      AND status = 'active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CREATE TRIGGER: Update Alert Company Names
-- ============================================================================
DROP TRIGGER IF EXISTS trg_update_alert_company_names ON success_planning_overview;

CREATE TRIGGER trg_update_alert_company_names
  AFTER UPDATE OF company_name
  ON success_planning_overview
  FOR EACH ROW
  EXECUTE FUNCTION trg_update_alert_company_names();
