/*
  # Add Anonymous Access Policies for Success Planning Tables

  ## Changes
  - Add RLS policies for anonymous (unauthenticated) users to all success planning tables
  - Enables demo/development access without authentication
  
  ## Security Note
  - These policies allow full access to anonymous users
  - In production, these should be restricted based on business requirements
  
  ## Tables Updated
  1. success_planning_overview
  2. success_planning_stakeholders
  3. success_planning_team
  4. success_planning_goals
  5. success_planning_activities
  6. success_planning_actions
  7. success_planning_health
*/

-- RLS Policies for success_planning_overview (anonymous users)
CREATE POLICY "Anonymous users can view success planning overview"
  ON success_planning_overview FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can insert success planning overview"
  ON success_planning_overview FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can update success planning overview"
  ON success_planning_overview FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous users can delete success planning overview"
  ON success_planning_overview FOR DELETE
  TO anon
  USING (true);

-- RLS Policies for success_planning_stakeholders (anonymous users)
CREATE POLICY "Anonymous users can view stakeholders"
  ON success_planning_stakeholders FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can insert stakeholders"
  ON success_planning_stakeholders FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can update stakeholders"
  ON success_planning_stakeholders FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous users can delete stakeholders"
  ON success_planning_stakeholders FOR DELETE
  TO anon
  USING (true);

-- RLS Policies for success_planning_team (anonymous users)
CREATE POLICY "Anonymous users can view team members"
  ON success_planning_team FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can insert team members"
  ON success_planning_team FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can update team members"
  ON success_planning_team FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous users can delete team members"
  ON success_planning_team FOR DELETE
  TO anon
  USING (true);

-- RLS Policies for success_planning_goals (anonymous users)
CREATE POLICY "Anonymous users can view goals"
  ON success_planning_goals FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can insert goals"
  ON success_planning_goals FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can update goals"
  ON success_planning_goals FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous users can delete goals"
  ON success_planning_goals FOR DELETE
  TO anon
  USING (true);

-- RLS Policies for success_planning_activities (anonymous users)
CREATE POLICY "Anonymous users can view activities"
  ON success_planning_activities FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can insert activities"
  ON success_planning_activities FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can update activities"
  ON success_planning_activities FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous users can delete activities"
  ON success_planning_activities FOR DELETE
  TO anon
  USING (true);

-- RLS Policies for success_planning_actions (anonymous users)
CREATE POLICY "Anonymous users can view actions"
  ON success_planning_actions FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can insert actions"
  ON success_planning_actions FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can update actions"
  ON success_planning_actions FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous users can delete actions"
  ON success_planning_actions FOR DELETE
  TO anon
  USING (true);

-- RLS Policies for success_planning_health (anonymous users)
CREATE POLICY "Anonymous users can view health scores"
  ON success_planning_health FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can insert health scores"
  ON success_planning_health FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can update health scores"
  ON success_planning_health FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous users can delete health scores"
  ON success_planning_health FOR DELETE
  TO anon
  USING (true);