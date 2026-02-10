/*
  # Backfill Audit Log from Existing Restoration and Purge Data

  ## Purpose
  - Migrate historical restoration events from client_restoration_log to audit_log
  - Migrate historical purge events from purge_log to audit_log
  - Ensures complete audit trail history
*/

-- ============================================================================
-- Backfill CLIENT_RESTORED events from client_restoration_log
-- ============================================================================

INSERT INTO audit_log (
  timestamp,
  action,
  user_email,
  user_name,
  user_role,
  resource,
  client_id,
  client_name,
  details,
  created_at
)
SELECT
  restored_at as timestamp,
  'CLIENT_RESTORED' as action,
  restored_by as user_email,
  restored_by as user_name,
  'admin' as user_role,
  'client_account' as resource,
  client_id,
  company_name as client_name,
  jsonb_build_object(
    'restoration_reason', COALESCE(restoration_reason, 'No reason provided'),
    'was_deleted_at', was_deleted_at,
    'was_deleted_by', was_deleted_by,
    'original_deletion_reason', COALESCE(original_deletion_reason, 'No reason provided'),
    'days_in_deleted_state', days_in_deleted_state
  ) as details,
  restored_at as created_at
FROM client_restoration_log
WHERE NOT EXISTS (
  SELECT 1 FROM audit_log
  WHERE audit_log.action = 'CLIENT_RESTORED'
  AND audit_log.client_id = client_restoration_log.client_id
  AND audit_log.timestamp = client_restoration_log.restored_at
);

-- ============================================================================
-- Backfill CLIENT_PURGED events from purge_log
-- ============================================================================

INSERT INTO audit_log (
  timestamp,
  action,
  user_email,
  user_name,
  user_role,
  resource,
  client_id,
  client_name,
  details,
  created_at
)
SELECT
  purged_at as timestamp,
  'CLIENT_PURGED' as action,
  COALESCE(
    CASE 
      WHEN notes LIKE '%Manual purge by%' 
      THEN regexp_replace(notes, '.*Manual purge by ([^.]+)\..*', '\1')
      ELSE 'system'
    END,
    'system'
  ) as user_email,
  CASE 
    WHEN notes LIKE '%Manual purge by%' 
    THEN regexp_replace(notes, '.*Manual purge by ([^.]+)\..*', '\1')
    ELSE 'System'
  END as user_name,
  CASE 
    WHEN notes LIKE '%Manual purge by%' THEN 'admin'
    ELSE 'system'
  END as user_role,
  'client_account' as resource,
  client_id,
  company_name as client_name,
  jsonb_build_object(
    'purge_type', CASE WHEN notes LIKE '%Manual purge%' THEN 'manual' ELSE 'automatic' END,
    'original_deletion_reason', COALESCE(deletion_reason, 'No reason provided'),
    'deleted_at', deleted_at,
    'deleted_by', deleted_by,
    'record_counts', record_counts,
    'days_since_deletion', EXTRACT(DAY FROM (purged_at - deleted_at))::integer,
    'notes', notes
  ) as details,
  purged_at as created_at
FROM purge_log
WHERE NOT EXISTS (
  SELECT 1 FROM audit_log
  WHERE audit_log.action = 'CLIENT_PURGED'
  AND audit_log.client_id = purge_log.client_id
  AND audit_log.timestamp = purge_log.purged_at
);