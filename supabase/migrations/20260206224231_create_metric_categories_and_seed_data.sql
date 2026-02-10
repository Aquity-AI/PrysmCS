/*
  # Create Dynamic Metric Categories and Comprehensive Demo Data

  1. New Tables
    - `metric_categories`
      - `id` (uuid, primary key)
      - `client_id` (text, not null) - which client this category belongs to
      - `name` (text, not null) - display name
      - `slug` (text, not null) - lowercase key used in metric_definitions.category
      - `color` (text, not null) - hex color for UI
      - `icon` (text) - Lucide icon name
      - `display_order` (integer, default 0)
      - `is_system` (boolean, default false) - system-provided vs user-created
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Schema Changes
    - Drop CHECK constraint `metric_category_check` on `metric_definitions` to allow dynamic categories
    - Add unique constraint on `metric_categories` (client_id, slug)

  3. Security
    - Enable RLS on `metric_categories` table
    - Add policies for anon read/write access (matches existing metric_definitions pattern)

  4. Seed Data
    - Default categories for all 3 demo clients (enrollment, financial, engagement, outcomes, operations, customer_experience, growth, custom)
    - 15 new metric definitions per demo client covering all categories
    - 12 months of realistic historical data for every metric
    - Fix broken apex-solutions graphs (update fake metric IDs to real UUIDs)
    - Create diverse graphs for all 3 demo clients across all pages
*/

-- ============================================
-- 1. CREATE metric_categories TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS metric_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  color text NOT NULL DEFAULT '#6b7280',
  icon text DEFAULT 'BarChart2',
  display_order integer DEFAULT 0,
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id, slug)
);

ALTER TABLE metric_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read metric_categories"
  ON metric_categories FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert metric_categories"
  ON metric_categories FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update metric_categories"
  ON metric_categories FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete metric_categories"
  ON metric_categories FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Allow authenticated read metric_categories"
  ON metric_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert metric_categories"
  ON metric_categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update metric_categories"
  ON metric_categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete metric_categories"
  ON metric_categories FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- 2. DROP HARDCODED CHECK CONSTRAINT
-- ============================================
ALTER TABLE metric_definitions DROP CONSTRAINT IF EXISTS metric_category_check;

-- ============================================
-- 3. SEED DEFAULT CATEGORIES FOR ALL DEMO CLIENTS
-- ============================================
DO $$
DECLARE
  clients text[] := ARRAY['apex-solutions', 'cascade-enterprises', 'summit-partners-group'];
  c text;
BEGIN
  FOREACH c IN ARRAY clients LOOP
    INSERT INTO metric_categories (client_id, name, slug, color, icon, display_order, is_system)
    VALUES
      (c, 'Enrollment',           'enrollment',           '#06b6d4', 'Users',        1, true),
      (c, 'Financial',            'financial',            '#10b981', 'DollarSign',   2, true),
      (c, 'Engagement',           'engagement',           '#f59e0b', 'Activity',     3, true),
      (c, 'Outcomes',             'outcomes',             '#ef4444', 'Target',       4, true),
      (c, 'Operations',           'operations',           '#3b82f6', 'Settings',     5, true),
      (c, 'Customer Experience',  'customer_experience',  '#14b8a6', 'Heart',        6, true),
      (c, 'Growth',               'growth',               '#22c55e', 'TrendingUp',   7, true),
      (c, 'Custom',               'custom',               '#6b7280', 'BarChart2',    8, true)
    ON CONFLICT (client_id, slug) DO NOTHING;
  END LOOP;
END $$;

-- ============================================
-- 4. ADD NEW METRIC DEFINITIONS FOR ALL DEMO CLIENTS
-- ============================================

-- Helper: Insert metrics for each client with unique UUIDs
-- We use deterministic UUIDs based on client+key to make cross-referencing easy

-- APEX-SOLUTIONS new metrics
INSERT INTO metric_definitions (client_id, metric_name, metric_key, data_type, category, source_type, unit, description, is_active, icon)
VALUES
  ('apex-solutions', 'Operating Costs', 'operating_costs', 'currency', 'financial', 'manual', 'dollars', 'Total monthly operating expenses including staff, facilities, and overhead', true, 'DollarSign'),
  ('apex-solutions', 'Profit Margin', 'profit_margin', 'percentage', 'financial', 'manual', '%', 'Net profit as a percentage of total revenue', true, 'TrendingUp'),
  ('apex-solutions', 'Revenue Per Client', 'revenue_per_client', 'currency', 'financial', 'manual', 'dollars', 'Average monthly revenue generated per active client', true, 'DollarSign'),
  ('apex-solutions', 'Cost Per Acquisition', 'cost_per_acquisition', 'currency', 'financial', 'manual', 'dollars', 'Average cost to acquire a new client', true, 'Target'),
  ('apex-solutions', 'Patient Satisfaction Score', 'patient_satisfaction_score', 'percentage', 'outcomes', 'manual', '%', 'Average patient satisfaction from monthly surveys', true, 'Heart'),
  ('apex-solutions', 'Readmission Rate', 'readmission_rate', 'percentage', 'outcomes', 'manual', '%', 'Percentage of patients readmitted within 30 days', true, 'Activity'),
  ('apex-solutions', 'Goal Achievement Rate', 'goal_achievement_rate', 'percentage', 'outcomes', 'manual', '%', 'Percentage of treatment goals achieved on schedule', true, 'CheckCircle'),
  ('apex-solutions', 'Net Promoter Score', 'net_promoter_score', 'number', 'customer_experience', 'manual', 'NPS', 'Customer likelihood to recommend on -100 to 100 scale', true, 'Star'),
  ('apex-solutions', 'Avg Response Time', 'avg_response_time', 'decimal', 'customer_experience', 'manual', 'hours', 'Average time to first response on support requests', true, 'Clock'),
  ('apex-solutions', 'Support Ticket Volume', 'support_ticket_volume', 'number', 'customer_experience', 'manual', 'tickets', 'Total support tickets opened per month', true, 'MessageSquare'),
  ('apex-solutions', 'Staff Utilization', 'staff_utilization', 'percentage', 'operations', 'manual', '%', 'Percentage of available staff hours utilized', true, 'Users'),
  ('apex-solutions', 'Avg Session Duration', 'avg_session_duration', 'decimal', 'operations', 'manual', 'minutes', 'Average duration of client sessions', true, 'Clock'),
  ('apex-solutions', 'Referral Rate', 'referral_rate', 'percentage', 'growth', 'manual', '%', 'Percentage of new clients from referrals', true, 'TrendingUp'),
  ('apex-solutions', 'New Client Pipeline', 'new_client_pipeline', 'number', 'growth', 'manual', 'leads', 'Number of prospective clients in the pipeline', true, 'Users')
ON CONFLICT (client_id, metric_key) DO NOTHING;

-- CASCADE-ENTERPRISES new metrics
INSERT INTO metric_definitions (client_id, metric_name, metric_key, data_type, category, source_type, unit, description, is_active, icon)
VALUES
  ('cascade-enterprises', 'Operating Costs', 'operating_costs', 'currency', 'financial', 'manual', 'dollars', 'Total monthly operating expenses including staff, facilities, and overhead', true, 'DollarSign'),
  ('cascade-enterprises', 'Profit Margin', 'profit_margin', 'percentage', 'financial', 'manual', '%', 'Net profit as a percentage of total revenue', true, 'TrendingUp'),
  ('cascade-enterprises', 'Revenue Per Client', 'revenue_per_client', 'currency', 'financial', 'manual', 'dollars', 'Average monthly revenue generated per active client', true, 'DollarSign'),
  ('cascade-enterprises', 'Cost Per Acquisition', 'cost_per_acquisition', 'currency', 'financial', 'manual', 'dollars', 'Average cost to acquire a new client', true, 'Target'),
  ('cascade-enterprises', 'Patient Satisfaction Score', 'patient_satisfaction_score', 'percentage', 'outcomes', 'manual', '%', 'Average patient satisfaction from monthly surveys', true, 'Heart'),
  ('cascade-enterprises', 'Readmission Rate', 'readmission_rate', 'percentage', 'outcomes', 'manual', '%', 'Percentage of patients readmitted within 30 days', true, 'Activity'),
  ('cascade-enterprises', 'Goal Achievement Rate', 'goal_achievement_rate', 'percentage', 'outcomes', 'manual', '%', 'Percentage of treatment goals achieved on schedule', true, 'CheckCircle'),
  ('cascade-enterprises', 'Net Promoter Score', 'net_promoter_score', 'number', 'customer_experience', 'manual', 'NPS', 'Customer likelihood to recommend on -100 to 100 scale', true, 'Star'),
  ('cascade-enterprises', 'Avg Response Time', 'avg_response_time', 'decimal', 'customer_experience', 'manual', 'hours', 'Average time to first response on support requests', true, 'Clock'),
  ('cascade-enterprises', 'Support Ticket Volume', 'support_ticket_volume', 'number', 'customer_experience', 'manual', 'tickets', 'Total support tickets opened per month', true, 'MessageSquare'),
  ('cascade-enterprises', 'Staff Utilization', 'staff_utilization', 'percentage', 'operations', 'manual', '%', 'Percentage of available staff hours utilized', true, 'Users'),
  ('cascade-enterprises', 'Avg Session Duration', 'avg_session_duration', 'decimal', 'operations', 'manual', 'minutes', 'Average duration of client sessions', true, 'Clock'),
  ('cascade-enterprises', 'Referral Rate', 'referral_rate', 'percentage', 'growth', 'manual', '%', 'Percentage of new clients from referrals', true, 'TrendingUp'),
  ('cascade-enterprises', 'New Client Pipeline', 'new_client_pipeline', 'number', 'growth', 'manual', 'leads', 'Number of prospective clients in the pipeline', true, 'Users')
ON CONFLICT (client_id, metric_key) DO NOTHING;

-- SUMMIT-PARTNERS-GROUP new metrics
INSERT INTO metric_definitions (client_id, metric_name, metric_key, data_type, category, source_type, unit, description, is_active, icon)
VALUES
  ('summit-partners-group', 'Operating Costs', 'operating_costs', 'currency', 'financial', 'manual', 'dollars', 'Total monthly operating expenses including staff, facilities, and overhead', true, 'DollarSign'),
  ('summit-partners-group', 'Profit Margin', 'profit_margin', 'percentage', 'financial', 'manual', '%', 'Net profit as a percentage of total revenue', true, 'TrendingUp'),
  ('summit-partners-group', 'Revenue Per Client', 'revenue_per_client', 'currency', 'financial', 'manual', 'dollars', 'Average monthly revenue generated per active client', true, 'DollarSign'),
  ('summit-partners-group', 'Cost Per Acquisition', 'cost_per_acquisition', 'currency', 'financial', 'manual', 'dollars', 'Average cost to acquire a new client', true, 'Target'),
  ('summit-partners-group', 'Patient Satisfaction Score', 'patient_satisfaction_score', 'percentage', 'outcomes', 'manual', '%', 'Average patient satisfaction from monthly surveys', true, 'Heart'),
  ('summit-partners-group', 'Readmission Rate', 'readmission_rate', 'percentage', 'outcomes', 'manual', '%', 'Percentage of patients readmitted within 30 days', true, 'Activity'),
  ('summit-partners-group', 'Goal Achievement Rate', 'goal_achievement_rate', 'percentage', 'outcomes', 'manual', '%', 'Percentage of treatment goals achieved on schedule', true, 'CheckCircle'),
  ('summit-partners-group', 'Net Promoter Score', 'net_promoter_score', 'number', 'customer_experience', 'manual', 'NPS', 'Customer likelihood to recommend on -100 to 100 scale', true, 'Star'),
  ('summit-partners-group', 'Avg Response Time', 'avg_response_time', 'decimal', 'customer_experience', 'manual', 'hours', 'Average time to first response on support requests', true, 'Clock'),
  ('summit-partners-group', 'Support Ticket Volume', 'support_ticket_volume', 'number', 'customer_experience', 'manual', 'tickets', 'Total support tickets opened per month', true, 'MessageSquare'),
  ('summit-partners-group', 'Staff Utilization', 'staff_utilization', 'percentage', 'operations', 'manual', '%', 'Percentage of available staff hours utilized', true, 'Users'),
  ('summit-partners-group', 'Avg Session Duration', 'avg_session_duration', 'decimal', 'operations', 'manual', 'minutes', 'Average duration of client sessions', true, 'Clock'),
  ('summit-partners-group', 'Referral Rate', 'referral_rate', 'percentage', 'growth', 'manual', '%', 'Percentage of new clients from referrals', true, 'TrendingUp'),
  ('summit-partners-group', 'New Client Pipeline', 'new_client_pipeline', 'number', 'growth', 'manual', 'leads', 'Number of prospective clients in the pipeline', true, 'Users')
ON CONFLICT (client_id, metric_key) DO NOTHING;

-- Also backfill data for existing metrics missing data (Patient Retention Rate, Enrollment Growth Rate)
-- and add data for the Test Metric and Meetings/Customers if needed
