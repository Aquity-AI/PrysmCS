/*
  # Add Anonymous Access Policies for Page Summaries

  ## Changes
  - Add RLS policies for anonymous (unauthenticated) users to all page summary tables
  - Enables demo/development access without authentication
  
  ## Security Note
  - These policies allow full access to anonymous users
  - In production, these should be restricted based on business requirements
  
  ## Tables Updated
  1. page_summaries
  2. page_summary_items
  3. ai_summary_config
  4. ai_summary_generation_log
*/

-- RLS Policies for page_summaries (anonymous users)
CREATE POLICY "Anonymous users can view page summaries"
  ON page_summaries FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can insert page summaries"
  ON page_summaries FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can update page summaries"
  ON page_summaries FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous users can delete page summaries"
  ON page_summaries FOR DELETE
  TO anon
  USING (true);

-- RLS Policies for page_summary_items (anonymous users)
CREATE POLICY "Anonymous users can view summary items"
  ON page_summary_items FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can insert summary items"
  ON page_summary_items FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can update summary items"
  ON page_summary_items FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous users can delete summary items"
  ON page_summary_items FOR DELETE
  TO anon
  USING (true);

-- RLS Policies for ai_summary_config (anonymous users)
CREATE POLICY "Anonymous users can view ai config"
  ON ai_summary_config FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can insert ai config"
  ON ai_summary_config FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can update ai config"
  ON ai_summary_config FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous users can delete ai config"
  ON ai_summary_config FOR DELETE
  TO anon
  USING (true);

-- RLS Policies for ai_summary_generation_log (anonymous users)
CREATE POLICY "Anonymous users can view generation log"
  ON ai_summary_generation_log FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can insert generation log"
  ON ai_summary_generation_log FOR INSERT
  TO anon
  WITH CHECK (true);
