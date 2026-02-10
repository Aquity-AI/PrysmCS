/*
  # Create Scheduled Jobs for Alert Management

  ## Overview
  This migration creates two scheduled jobs using pg_cron:
  1. Daily sweep to generate alerts for any overdue actions at 1:00 AM UTC
  2. Weekly cleanup to purge old dismissed alerts at 2:00 AM UTC on Sundays

  ## New Functions

  1. `sweep_overdue_actions_for_alerts()`
     - Scans all open actions with past due dates
     - Generates alerts for any that don't have active alerts
     - Logs the count of alerts created

  2. `purge_old_dismissed_alerts()`
     - Deletes dismissed alerts older than 30 days
     - Keeps database clean and performant
     - Logs the count of alerts purged

  ## Scheduled Jobs

  1. Daily Sweep: Runs at 1:00 AM UTC every day
     - Catches items that became overdue overnight
     - Backup to trigger-based system
     - Ensures no overdue items slip through

  2. Weekly Cleanup: Runs at 2:00 AM UTC every Sunday
     - Purges old dismissed alerts
     - Maintains database performance
     - Prevents unbounded table growth
*/

-- ============================================================================
-- FUNCTION: Sweep for Overdue Actions and Create Alerts
-- ============================================================================
CREATE OR REPLACE FUNCTION sweep_overdue_actions_for_alerts()
RETURNS void AS $$
DECLARE
  v_action_record RECORD;
  v_alerts_created integer := 0;
  v_alert_id uuid;
BEGIN
  -- Loop through all overdue actions
  FOR v_action_record IN
    SELECT id
    FROM success_planning_actions
    WHERE status != 'Completed'
      AND due_date IS NOT NULL
      AND due_date < CURRENT_DATE
      AND NOT EXISTS (
        SELECT 1 
        FROM notification_alerts 
        WHERE action_id = success_planning_actions.id 
          AND status = 'active'
      )
  LOOP
    -- Generate alert for this overdue action
    v_alert_id := generate_alert_for_overdue_action(v_action_record.id);
    
    -- Count successful alert creations
    IF v_alert_id IS NOT NULL THEN
      v_alerts_created := v_alerts_created + 1;
    END IF;
  END LOOP;
  
  -- Log the sweep results
  RAISE NOTICE 'Alert sweep completed: % new alerts created at %', v_alerts_created, NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Purge Old Dismissed Alerts
-- ============================================================================
CREATE OR REPLACE FUNCTION purge_old_dismissed_alerts()
RETURNS void AS $$
DECLARE
  v_deleted_count integer;
BEGIN
  -- Delete dismissed alerts older than 30 days
  WITH deleted AS (
    DELETE FROM notification_alerts
    WHERE status = 'dismissed'
      AND dismissed_at < NOW() - INTERVAL '30 days'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;
  
  -- Log the cleanup results
  RAISE NOTICE 'Alert cleanup completed: % old alerts purged at %', v_deleted_count, NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ENABLE pg_cron EXTENSION (if not already enabled)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================================
-- SCHEDULE DAILY SWEEP JOB
-- ============================================================================

-- Remove existing job if it exists
SELECT cron.unschedule('sweep-overdue-alerts-daily')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'sweep-overdue-alerts-daily'
);

-- Schedule daily sweep at 1:00 AM UTC
SELECT cron.schedule(
  'sweep-overdue-alerts-daily',
  '0 1 * * *',
  $$SELECT sweep_overdue_actions_for_alerts()$$
);

-- ============================================================================
-- SCHEDULE WEEKLY CLEANUP JOB
-- ============================================================================

-- Remove existing job if it exists
SELECT cron.unschedule('purge-dismissed-alerts-weekly')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'purge-dismissed-alerts-weekly'
);

-- Schedule weekly cleanup at 2:00 AM UTC on Sundays (day 0)
SELECT cron.schedule(
  'purge-dismissed-alerts-weekly',
  '0 2 * * 0',
  $$SELECT purge_old_dismissed_alerts()$$
);
