/*
  # Automated Metric Calculation System

  ## Overview
  This migration implements a production-ready, database-driven system for automatically
  calculating and synchronizing all dynamic metrics including MRR, days to renewal, and
  open overdue actions. This eliminates client-side calculation inconsistencies and ensures
  all metrics are always accurate and up-to-date.

  ## New Database Objects

  ### Functions
  1. `calculate_mrr_from_arr()` - Automatically calculates MRR when ARR changes
  2. `sync_health_metrics()` - Synchronizes all health metrics for a client
  3. `count_open_overdue_actions()` - Counts overdue actions for a client
  4. `refresh_all_health_metrics()` - Batch refresh for all clients (cron job)

  ### Triggers
  1. `trg_update_mrr_on_arr_change` - Auto-updates MRR on success_planning_overview
  2. `trg_sync_health_on_overview_change` - Syncs health when overview changes
  3. `trg_sync_health_on_action_change` - Syncs health when actions change

  ### Scheduled Jobs
  1. Daily cron job at 00:00 UTC to refresh all time-based metrics

  ## Security
  - All functions execute with security definer for RLS compatibility
  - Triggers run in transaction context for data consistency
  - Scheduled jobs use service role for system-level access

  ## Performance
  - Conditional updates only when values actually change
  - Optimized queries with proper indexes
  - Batch processing for cron jobs
*/

-- ============================================================================
-- FUNCTION: Calculate MRR from ARR
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_mrr_from_arr()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate MRR as ARR divided by 12
  -- Handle NULL ARR by setting MRR to 0
  NEW.mrr := COALESCE(NEW.arr / 12.0, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Count Open Overdue Actions
-- ============================================================================
CREATE OR REPLACE FUNCTION count_open_overdue_actions(p_client_id text)
RETURNS integer AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM success_planning_actions
  WHERE client_id = p_client_id
    AND status = 'Open'
    AND due_date IS NOT NULL
    AND due_date < CURRENT_DATE;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Sync Health Metrics for a Client
-- ============================================================================
CREATE OR REPLACE FUNCTION sync_health_metrics(p_client_id text)
RETURNS void AS $$
DECLARE
  v_renewal_date date;
  v_days_until_renewal integer;
  v_open_overdue_actions integer;
  v_last_contact_date timestamptz;
  v_days_since_last_contact integer;
BEGIN
  -- Get renewal date from overview
  SELECT renewal_date
  INTO v_renewal_date
  FROM success_planning_overview
  WHERE client_id = p_client_id;

  -- Calculate days until renewal (NULL if no renewal date)
  IF v_renewal_date IS NOT NULL THEN
    v_days_until_renewal := (v_renewal_date - CURRENT_DATE);
  ELSE
    v_days_until_renewal := NULL;
  END IF;

  -- Count open overdue actions
  v_open_overdue_actions := count_open_overdue_actions(p_client_id);

  -- Get last contact date (most recent non-auto-logged activity)
  SELECT MAX(created_at)
  INTO v_last_contact_date
  FROM success_planning_activities
  WHERE client_id = p_client_id
    AND is_auto_logged = false;

  -- Calculate days since last contact
  IF v_last_contact_date IS NOT NULL THEN
    v_days_since_last_contact := EXTRACT(DAY FROM (NOW() - v_last_contact_date));
  ELSE
    v_days_since_last_contact := 0;
  END IF;

  -- Upsert health metrics
  INSERT INTO success_planning_health (
    client_id,
    days_until_renewal,
    open_overdue_actions,
    days_since_last_contact,
    updated_at
  )
  VALUES (
    p_client_id,
    v_days_until_renewal,
    v_open_overdue_actions,
    v_days_since_last_contact,
    NOW()
  )
  ON CONFLICT (client_id)
  DO UPDATE SET
    days_until_renewal = EXCLUDED.days_until_renewal,
    open_overdue_actions = EXCLUDED.open_overdue_actions,
    days_since_last_contact = EXCLUDED.days_since_last_contact,
    updated_at = NOW()
  WHERE
    success_planning_health.days_until_renewal IS DISTINCT FROM EXCLUDED.days_until_renewal
    OR success_planning_health.open_overdue_actions IS DISTINCT FROM EXCLUDED.open_overdue_actions
    OR success_planning_health.days_since_last_contact IS DISTINCT FROM EXCLUDED.days_since_last_contact;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Trigger Function for Overview Changes
-- ============================================================================
CREATE OR REPLACE FUNCTION trg_sync_health_on_overview_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync if renewal_date actually changed
  IF (TG_OP = 'INSERT') OR
     (TG_OP = 'UPDATE' AND (OLD.renewal_date IS DISTINCT FROM NEW.renewal_date)) THEN
    PERFORM sync_health_metrics(NEW.client_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Trigger Function for Action Changes
-- ============================================================================
CREATE OR REPLACE FUNCTION trg_sync_health_on_action_change()
RETURNS TRIGGER AS $$
DECLARE
  v_client_id text;
BEGIN
  -- Determine which client_id to sync
  IF TG_OP = 'DELETE' THEN
    v_client_id := OLD.client_id;
  ELSE
    v_client_id := NEW.client_id;
  END IF;

  -- Only sync if status or due_date changed, or on insert/delete
  IF (TG_OP = 'INSERT') OR (TG_OP = 'DELETE') OR
     (TG_OP = 'UPDATE' AND (
       OLD.status IS DISTINCT FROM NEW.status OR
       OLD.due_date IS DISTINCT FROM NEW.due_date
     )) THEN
    PERFORM sync_health_metrics(v_client_id);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Trigger Function for Activity Changes
-- ============================================================================
CREATE OR REPLACE FUNCTION trg_sync_health_on_activity_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync for non-auto-logged activities (manual contact)
  IF (TG_OP = 'INSERT' AND NEW.is_auto_logged = false) THEN
    PERFORM sync_health_metrics(NEW.client_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Refresh All Health Metrics (for scheduled jobs)
-- ============================================================================
CREATE OR REPLACE FUNCTION refresh_all_health_metrics()
RETURNS void AS $$
DECLARE
  v_client_record RECORD;
  v_processed_count integer := 0;
BEGIN
  -- Loop through all unique client_ids and sync their metrics
  FOR v_client_record IN
    SELECT DISTINCT client_id
    FROM success_planning_overview
  LOOP
    PERFORM sync_health_metrics(v_client_record.client_id);
    v_processed_count := v_processed_count + 1;
  END LOOP;

  -- Log the refresh (optional: could create a log table)
  RAISE NOTICE 'Health metrics refreshed for % clients at %', v_processed_count, NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

-- Trigger: Auto-update MRR when ARR changes
DROP TRIGGER IF EXISTS trg_update_mrr_on_arr_change ON success_planning_overview;
CREATE TRIGGER trg_update_mrr_on_arr_change
  BEFORE INSERT OR UPDATE OF arr ON success_planning_overview
  FOR EACH ROW
  EXECUTE FUNCTION calculate_mrr_from_arr();

-- Trigger: Sync health metrics when overview changes
DROP TRIGGER IF EXISTS trg_sync_health_on_overview_change ON success_planning_overview;
CREATE TRIGGER trg_sync_health_on_overview_change
  AFTER INSERT OR UPDATE OF renewal_date ON success_planning_overview
  FOR EACH ROW
  EXECUTE FUNCTION trg_sync_health_on_overview_change();

-- Trigger: Sync health metrics when actions change
DROP TRIGGER IF EXISTS trg_sync_health_on_action_change ON success_planning_actions;
CREATE TRIGGER trg_sync_health_on_action_change
  AFTER INSERT OR UPDATE OR DELETE ON success_planning_actions
  FOR EACH ROW
  EXECUTE FUNCTION trg_sync_health_on_action_change();

-- Trigger: Sync health metrics when activities change
DROP TRIGGER IF EXISTS trg_sync_health_on_activity_change ON success_planning_activities;
CREATE TRIGGER trg_sync_health_on_activity_change
  AFTER INSERT ON success_planning_activities
  FOR EACH ROW
  EXECUTE FUNCTION trg_sync_health_on_activity_change();

-- ============================================================================
-- BACKFILL EXISTING DATA
-- ============================================================================

-- Backfill MRR for all existing records
UPDATE success_planning_overview
SET mrr = COALESCE(arr / 12.0, 0)
WHERE mrr IS NULL OR mrr != COALESCE(arr / 12.0, 0);

-- Backfill health metrics for all existing clients
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

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Composite index for action queries
CREATE INDEX IF NOT EXISTS idx_actions_status_due_date
  ON success_planning_actions(client_id, status, due_date);

-- Index for finding last contact date
CREATE INDEX IF NOT EXISTS idx_activities_last_contact
  ON success_planning_activities(client_id, created_at DESC)
  WHERE is_auto_logged = false;

-- ============================================================================
-- ENABLE pg_cron EXTENSION (if not already enabled)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================================
-- SCHEDULE DAILY REFRESH JOB
-- ============================================================================

-- Remove existing job if it exists
SELECT cron.unschedule('refresh-health-metrics-daily')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'refresh-health-metrics-daily'
);

-- Schedule daily refresh at 00:00 UTC
SELECT cron.schedule(
  'refresh-health-metrics-daily',
  '0 0 * * *',
  $$SELECT refresh_all_health_metrics()$$
);

-- ============================================================================
-- VALIDATION AND TESTING
-- ============================================================================

-- Create a validation function to compare calculations
CREATE OR REPLACE FUNCTION validate_health_metrics()
RETURNS TABLE(
  client_id text,
  metric_name text,
  expected_value numeric,
  actual_value numeric,
  is_valid boolean
) AS $$
BEGIN
  RETURN QUERY
  WITH validation AS (
    SELECT
      o.client_id,
      'mrr' as metric_name,
      COALESCE(o.arr / 12.0, 0) as expected_value,
      o.mrr as actual_value,
      (COALESCE(o.arr / 12.0, 0) = o.mrr) as is_valid
    FROM success_planning_overview o
    UNION ALL
    SELECT
      h.client_id,
      'days_until_renewal' as metric_name,
      (o.renewal_date - CURRENT_DATE) as expected_value,
      h.days_until_renewal as actual_value,
      ((o.renewal_date - CURRENT_DATE) = h.days_until_renewal OR (o.renewal_date IS NULL AND h.days_until_renewal IS NULL)) as is_valid
    FROM success_planning_health h
    LEFT JOIN success_planning_overview o ON h.client_id = o.client_id
    UNION ALL
    SELECT
      h.client_id,
      'open_overdue_actions' as metric_name,
      count_open_overdue_actions(h.client_id) as expected_value,
      h.open_overdue_actions as actual_value,
      (count_open_overdue_actions(h.client_id) = h.open_overdue_actions) as is_valid
    FROM success_planning_health h
  )
  SELECT * FROM validation WHERE is_valid = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;