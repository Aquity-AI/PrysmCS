/*
  # Backfill Alerts for Existing Overdue Actions

  ## Overview
  This one-time migration scans all existing action items and generates alerts
  for any that are currently overdue. This ensures that the notification system
  is immediately populated with relevant alerts upon deployment.

  ## Process
  1. Find all actions with status != 'Completed' and due_date < CURRENT_DATE
  2. For each overdue action, call generate_alert_for_overdue_action()
  3. Log the total count of alerts created

  ## Safety
  - The generate_alert_for_overdue_action() function already checks for duplicates
  - Safe to run multiple times without creating duplicate alerts
  - Uses existing indexes for fast queries
*/

-- ============================================================================
-- BACKFILL: Generate Alerts for All Existing Overdue Actions
-- ============================================================================
DO $$
DECLARE
  v_action_record RECORD;
  v_alerts_created integer := 0;
  v_alert_id uuid;
BEGIN
  RAISE NOTICE 'Starting backfill of overdue action alerts...';
  
  -- Loop through all overdue actions
  FOR v_action_record IN
    SELECT id, title, client_id, due_date
    FROM success_planning_actions
    WHERE status != 'Completed'
      AND due_date IS NOT NULL
      AND due_date < CURRENT_DATE
    ORDER BY due_date ASC
  LOOP
    -- Generate alert for this overdue action
    v_alert_id := generate_alert_for_overdue_action(v_action_record.id);
    
    -- Count successful alert creations
    IF v_alert_id IS NOT NULL THEN
      v_alerts_created := v_alerts_created + 1;
      RAISE NOTICE 'Created alert for action: % (client: %, due: %)', 
        v_action_record.title, 
        v_action_record.client_id, 
        v_action_record.due_date;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Backfill completed: % alerts created for existing overdue actions', v_alerts_created;
END $$;
