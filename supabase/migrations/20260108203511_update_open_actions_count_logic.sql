/*
  # Update Open Actions Count Logic

  ## Overview
  Changes the open_overdue_actions metric to count ALL open action items,
  not just overdue ones. This provides a better view of total workload.

  ## Changes
  1. Update `count_open_overdue_actions()` function to count all open actions
  2. Keep the column name for backward compatibility
  3. Backfill existing data with new calculation

  ## Notes
  - Column name `open_overdue_actions` remains unchanged to avoid breaking changes
  - Function now counts all actions with status = 'Open' regardless of due date
*/

-- ============================================================================
-- UPDATE FUNCTION: Count All Open Actions (not just overdue)
-- ============================================================================
CREATE OR REPLACE FUNCTION count_open_overdue_actions(p_client_id text)
RETURNS integer AS $$
DECLARE
  v_count integer;
BEGIN
  -- Count ALL open actions, not just overdue ones
  SELECT COUNT(*)
  INTO v_count
  FROM success_planning_actions
  WHERE client_id = p_client_id
    AND status = 'Open';

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- BACKFILL: Recalculate open actions count for all clients
-- ============================================================================
DO $$
DECLARE
  v_client_record RECORD;
BEGIN
  FOR v_client_record IN
    SELECT DISTINCT client_id FROM success_planning_overview
  LOOP
    PERFORM sync_health_metrics(v_client_record.client_id);
  END LOOP;
END $$;