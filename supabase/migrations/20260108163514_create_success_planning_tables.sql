-- Create Success Planning System Tables
-- 
-- Overview: This migration creates a comprehensive success planning system with automated 
-- health scoring, activity logging, and team collaboration features.
--
-- New Tables:
-- 1. success_planning_overview - Client company information and contract details
-- 2. success_planning_stakeholders - Client-side key contacts and hierarchy
-- 3. success_planning_team - Internal team members and assignments
-- 4. success_planning_goals - Client goals with progress tracking
-- 5. success_planning_activities - Activity log with auto-logging
-- 6. success_planning_actions - Action items with assignees
-- 7. success_planning_health - Health score history and CSM notes
--
-- Security: Enable RLS on all tables with policies for authenticated users
-- Performance: Add indexes on client_id, timestamps, and assignee fields

-- 1. Success Planning Overview Table
CREATE TABLE IF NOT EXISTS success_planning_overview (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  company_name text,
  address text,
  phone text,
  email text,
  website text,
  arr numeric DEFAULT 0,
  mrr numeric DEFAULT 0,
  renewal_date date,
  contract_start_date date,
  contract_term_months integer DEFAULT 12,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id)
);

-- 2. Success Planning Stakeholders Table
CREATE TABLE IF NOT EXISTS success_planning_stakeholders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  name text NOT NULL,
  title text,
  role text,
  email text,
  phone text,
  reports_to_id uuid REFERENCES success_planning_stakeholders(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Success Planning Team Table
CREATE TABLE IF NOT EXISTS success_planning_team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  user_name text NOT NULL,
  user_email text,
  user_phone text,
  role_type text NOT NULL,
  is_primary boolean DEFAULT false,
  assignment_date date DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Success Planning Goals Table
CREATE TABLE IF NOT EXISTS success_planning_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  title text NOT NULL,
  description text,
  target_date date,
  status text DEFAULT 'Not Started',
  priority integer DEFAULT 2,
  current_value numeric,
  target_value numeric,
  metric_unit text,
  next_milestone text,
  milestone_date date,
  notes text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Success Planning Activities Table
CREATE TABLE IF NOT EXISTS success_planning_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  activity_type text NOT NULL,
  description text NOT NULL,
  is_auto_logged boolean DEFAULT false,
  created_by text,
  related_entity_type text,
  related_entity_id uuid,
  created_at timestamptz DEFAULT now()
);

-- 6. Success Planning Actions Table
CREATE TABLE IF NOT EXISTS success_planning_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  title text NOT NULL,
  description text,
  assignee_id uuid REFERENCES success_planning_team(id) ON DELETE SET NULL,
  assignee_name text,
  due_date date,
  priority text DEFAULT 'Medium',
  status text DEFAULT 'Open',
  action_type text DEFAULT 'Standard',
  value_notes text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. Success Planning Health Table
CREATE TABLE IF NOT EXISTS success_planning_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  calculated_score text DEFAULT 'green',
  manual_override_score text,
  days_since_last_contact integer DEFAULT 0,
  days_until_renewal integer,
  open_overdue_actions integer DEFAULT 0,
  concerns text,
  success_wins text,
  relationship_notes text,
  show_in_success_stories boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id)
);

-- Enable Row Level Security
ALTER TABLE success_planning_overview ENABLE ROW LEVEL SECURITY;
ALTER TABLE success_planning_stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE success_planning_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE success_planning_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE success_planning_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE success_planning_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE success_planning_health ENABLE ROW LEVEL SECURITY;

-- RLS Policies for success_planning_overview
CREATE POLICY "Users can view success planning overview"
  ON success_planning_overview FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert success planning overview"
  ON success_planning_overview FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update success planning overview"
  ON success_planning_overview FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete success planning overview"
  ON success_planning_overview FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for success_planning_stakeholders
CREATE POLICY "Users can view stakeholders"
  ON success_planning_stakeholders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert stakeholders"
  ON success_planning_stakeholders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update stakeholders"
  ON success_planning_stakeholders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete stakeholders"
  ON success_planning_stakeholders FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for success_planning_team
CREATE POLICY "Users can view team members"
  ON success_planning_team FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert team members"
  ON success_planning_team FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update team members"
  ON success_planning_team FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete team members"
  ON success_planning_team FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for success_planning_goals
CREATE POLICY "Users can view goals"
  ON success_planning_goals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert goals"
  ON success_planning_goals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update goals"
  ON success_planning_goals FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete goals"
  ON success_planning_goals FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for success_planning_activities
CREATE POLICY "Users can view activities"
  ON success_planning_activities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert activities"
  ON success_planning_activities FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update activities"
  ON success_planning_activities FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete activities"
  ON success_planning_activities FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for success_planning_actions
CREATE POLICY "Users can view actions"
  ON success_planning_actions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert actions"
  ON success_planning_actions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update actions"
  ON success_planning_actions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete actions"
  ON success_planning_actions FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for success_planning_health
CREATE POLICY "Users can view health scores"
  ON success_planning_health FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert health scores"
  ON success_planning_health FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update health scores"
  ON success_planning_health FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete health scores"
  ON success_planning_health FOR DELETE
  TO authenticated
  USING (true);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_overview_client_id ON success_planning_overview(client_id);
CREATE INDEX IF NOT EXISTS idx_stakeholders_client_id ON success_planning_stakeholders(client_id);
CREATE INDEX IF NOT EXISTS idx_team_client_id ON success_planning_team(client_id);
CREATE INDEX IF NOT EXISTS idx_goals_client_id ON success_planning_goals(client_id);
CREATE INDEX IF NOT EXISTS idx_activities_client_id ON success_planning_activities(client_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON success_planning_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_actions_client_id ON success_planning_actions(client_id);
CREATE INDEX IF NOT EXISTS idx_actions_assignee_id ON success_planning_actions(assignee_id);
CREATE INDEX IF NOT EXISTS idx_actions_due_date ON success_planning_actions(due_date);
CREATE INDEX IF NOT EXISTS idx_health_client_id ON success_planning_health(client_id);