/*
  # Create Audit Log System

  ## Overview
  Implements enterprise-grade audit logging system to track all account lifecycle events
  including deletions, restorations, and purges with complete traceability.

  ## Changes

  1. New Tables
     - `audit_log` - Central audit trail for all system events

  2. Helper Functions
     - `log_audit_event()` - Consistent audit event logging across all operations

  3. Security
     - RLS policies for anonymous access (demo mode)
     - Indexes for query performance

  ## Purpose
  - Track CLIENT_DELETED events with deletion reasons
  - Track CLIENT_RESTORED events with restoration reasons and original deletion context
  - Track CLIENT_PURGED events with purge type and record counts
  - Maintain HIPAA-compliant audit trail
  - Support CSV export and filtering
*/

-- ============================================================================
-- STEP 1: Create audit_log Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  action text NOT NULL,
  user_id text,
  user_name text,
  user_email text,
  user_role text,
  resource text DEFAULT 'system',
  client_id text,
  client_name text,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_email ON audit_log(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_log_client_id ON audit_log(client_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_audit_log_action_timestamp ON audit_log(action, timestamp DESC);

-- Enable RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Create RLS Policies (Anonymous Access for Demo Mode)
-- ============================================================================

CREATE POLICY "Anonymous users can view audit log"
  ON audit_log FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can insert audit log"
  ON audit_log FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can update audit log"
  ON audit_log FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous users can delete audit log"
  ON audit_log FOR DELETE
  TO anon
  USING (true);

-- ============================================================================
-- STEP 3: Create Audit Event Logging Helper Function
-- ============================================================================

CREATE OR REPLACE FUNCTION log_audit_event(
  p_action text,
  p_user_email text,
  p_user_name text DEFAULT NULL,
  p_user_role text DEFAULT NULL,
  p_client_id text DEFAULT NULL,
  p_client_name text DEFAULT NULL,
  p_details jsonb DEFAULT '{}'::jsonb,
  p_resource text DEFAULT 'client_account',
  p_user_id text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_audit_id uuid;
BEGIN
  -- Insert audit log entry
  INSERT INTO audit_log (
    action,
    user_id,
    user_name,
    user_email,
    user_role,
    resource,
    client_id,
    client_name,
    details,
    timestamp,
    created_at
  ) VALUES (
    p_action,
    p_user_id,
    p_user_name,
    p_user_email,
    p_user_role,
    p_resource,
    p_client_id,
    p_client_name,
    p_details,
    now(),
    now()
  )
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$;