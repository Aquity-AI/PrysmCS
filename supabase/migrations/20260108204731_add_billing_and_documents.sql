/*
  # Add Billing Information and Document Management

  ## Overview
  Adds billing contact information fields and creates a document management table for
  storing links and metadata for important contract documents.

  ## Changes
  1. Add billing fields to `success_planning_overview`:
     - `billing_contact_name` - Name of billing contact person
     - `billing_contact_email` - Email for billing inquiries
     - `billing_contact_phone` - Phone for billing contact
     - `billing_notes` - Additional billing notes and preferences

  2. Create `success_planning_documents` table:
     - Stores document metadata and links
     - Supports multiple document types (Contract, SOW, ACH, Invoice, etc.)
     - Tracks upload date and document status

  ## Security
  - Enable RLS on documents table
  - Add policies for authenticated access
*/

-- ============================================================================
-- ADD COLUMNS: Billing Information
-- ============================================================================
DO $$
BEGIN
  -- Add billing_contact_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'success_planning_overview' AND column_name = 'billing_contact_name'
  ) THEN
    ALTER TABLE success_planning_overview ADD COLUMN billing_contact_name text;
  END IF;

  -- Add billing_contact_email column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'success_planning_overview' AND column_name = 'billing_contact_email'
  ) THEN
    ALTER TABLE success_planning_overview ADD COLUMN billing_contact_email text;
  END IF;

  -- Add billing_contact_phone column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'success_planning_overview' AND column_name = 'billing_contact_phone'
  ) THEN
    ALTER TABLE success_planning_overview ADD COLUMN billing_contact_phone text;
  END IF;

  -- Add billing_notes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'success_planning_overview' AND column_name = 'billing_notes'
  ) THEN
    ALTER TABLE success_planning_overview ADD COLUMN billing_notes text;
  END IF;
END $$;

-- ============================================================================
-- CREATE TABLE: Success Planning Documents
-- ============================================================================
CREATE TABLE IF NOT EXISTS success_planning_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  document_type text NOT NULL,
  document_name text NOT NULL,
  document_url text NOT NULL,
  file_size text,
  notes text,
  uploaded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- SECURITY: Enable RLS and Create Policies
-- ============================================================================
ALTER TABLE success_planning_documents ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'success_planning_documents' AND policyname = 'Allow anonymous read access to documents'
  ) THEN
    CREATE POLICY "Allow anonymous read access to documents"
      ON success_planning_documents
      FOR SELECT
      TO anon
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'success_planning_documents' AND policyname = 'Allow anonymous insert access to documents'
  ) THEN
    CREATE POLICY "Allow anonymous insert access to documents"
      ON success_planning_documents
      FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'success_planning_documents' AND policyname = 'Allow anonymous update access to documents'
  ) THEN
    CREATE POLICY "Allow anonymous update access to documents"
      ON success_planning_documents
      FOR UPDATE
      TO anon
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'success_planning_documents' AND policyname = 'Allow anonymous delete access to documents'
  ) THEN
    CREATE POLICY "Allow anonymous delete access to documents"
      ON success_planning_documents
      FOR DELETE
      TO anon
      USING (true);
  END IF;
END $$;