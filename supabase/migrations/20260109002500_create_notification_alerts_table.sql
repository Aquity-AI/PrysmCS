/*
  # Create Notification Alerts Table

  ## Overview
  Creates a notification_alerts table to store real-time alerts for overdue action items
  across the entire portfolio. This enables the bell icon notification system to display
  all overdue actions automatically without manual configuration.

  ## Changes
  1. New Table: `notification_alerts`
     - `id` (uuid, primary key) - Unique alert identifier
     - `action_id` (uuid, foreign key) - Links to success_planning_actions
     - `client_id` (text) - Client identifier for filtering
     - `client_name` (text) - Client display name (denormalized for performance)
     - `alert_type` (text) - Alert category: 'overdue', 'risk', 'opportunity'
     - `title` (text) - Alert headline
     - `message` (text) - Alert details
     - `status` (text) - Alert state: 'active', 'dismissed', 'snoozed'
     - `snooze_until` (timestamptz) - When snoozed alert becomes active again
     - `dismissed_at` (timestamptz) - Timestamp when alert was dismissed
     - `created_at` (timestamptz) - Alert creation timestamp

  2. Performance
     - Index on status for fast active alert queries
     - Index on created_at for chronological sorting
     - Index on action_id for quick lookups
     - Composite index on status and snooze_until for efficient filtering

  3. Security
     - Enable RLS with anonymous access policies (matching existing pattern)
     - Foreign key constraint with CASCADE delete to auto-clean when action deleted
*/

-- ============================================================================
-- CREATE TABLE: Notification Alerts
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id uuid NOT NULL,
  client_id text NOT NULL,
  client_name text NOT NULL,
  alert_type text NOT NULL DEFAULT 'overdue',
  title text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  snooze_until timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT fk_action
    FOREIGN KEY (action_id)
    REFERENCES success_planning_actions(id)
    ON DELETE CASCADE,
    
  CONSTRAINT chk_alert_type
    CHECK (alert_type IN ('overdue', 'risk', 'opportunity')),
    
  CONSTRAINT chk_status
    CHECK (status IN ('active', 'dismissed', 'snoozed'))
);

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_notification_alerts_status
  ON notification_alerts(status);

CREATE INDEX IF NOT EXISTS idx_notification_alerts_created_at
  ON notification_alerts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_alerts_action_id
  ON notification_alerts(action_id);

CREATE INDEX IF NOT EXISTS idx_notification_alerts_client_id
  ON notification_alerts(client_id);

-- Composite index for active/snoozed alert queries
CREATE INDEX IF NOT EXISTS idx_notification_alerts_status_snooze
  ON notification_alerts(status, snooze_until)
  WHERE status = 'active' OR status = 'snoozed';

-- ============================================================================
-- SECURITY: Enable RLS and Create Policies
-- ============================================================================
ALTER TABLE notification_alerts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notification_alerts' 
    AND policyname = 'Allow anonymous read access to alerts'
  ) THEN
    CREATE POLICY "Allow anonymous read access to alerts"
      ON notification_alerts
      FOR SELECT
      TO anon
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notification_alerts' 
    AND policyname = 'Allow anonymous insert access to alerts'
  ) THEN
    CREATE POLICY "Allow anonymous insert access to alerts"
      ON notification_alerts
      FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notification_alerts' 
    AND policyname = 'Allow anonymous update access to alerts'
  ) THEN
    CREATE POLICY "Allow anonymous update access to alerts"
      ON notification_alerts
      FOR UPDATE
      TO anon
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notification_alerts' 
    AND policyname = 'Allow anonymous delete access to alerts'
  ) THEN
    CREATE POLICY "Allow anonymous delete access to alerts"
      ON notification_alerts
      FOR DELETE
      TO anon
      USING (true);
  END IF;
END $$;
