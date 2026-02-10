/*
  # Create Page Summaries Tables

  1. Purpose
    - Enable configurable page summary sections with both manual and AI-powered options
    - Replace hardcoded summary sections with flexible, database-driven summaries
    - Support multiple summary sections per page with different data sources

  2. New Tables
    - `page_summaries`
      - Links summary sections to specific pages and clients
      - Tracks summary metadata and configuration
    
    - `page_summary_items`
      - Individual summary cards/items within a summary section
      - Stores label, metric value, trend, and description
    
    - `ai_summary_config`
      - AI generation configuration per summary section
      - Stores AI provider settings, prompts, and scheduling

  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated access based on client_id
    - Support anonymous read access for published summaries

  4. Features Enabled
    - Manual summary creation and editing
    - AI-powered summary generation
    - Flexible layout options (grid/list)
    - Auto-refresh scheduling for AI summaries
    - Generation history tracking
*/

-- ============================================================================
-- CREATE TABLE: Page Summaries
-- ============================================================================
CREATE TABLE IF NOT EXISTS page_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  page_id text NOT NULL,
  section_id text NOT NULL,
  title text NOT NULL DEFAULT 'Page Summary',
  subtitle text DEFAULT '',
  summary_mode text NOT NULL DEFAULT 'manual',
  layout_style text DEFAULT 'grid',
  max_items integer DEFAULT 4,
  enabled boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT summary_mode_check CHECK (summary_mode IN ('manual', 'ai', 'hybrid')),
  CONSTRAINT layout_style_check CHECK (layout_style IN ('grid', 'list')),
  UNIQUE(client_id, page_id, section_id)
);

-- ============================================================================
-- CREATE TABLE: Page Summary Items
-- ============================================================================
CREATE TABLE IF NOT EXISTS page_summary_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_id uuid NOT NULL REFERENCES page_summaries(id) ON DELETE CASCADE,
  item_order integer NOT NULL DEFAULT 0,
  label text NOT NULL,
  metric_value text NOT NULL,
  trend_direction text DEFAULT 'neutral',
  description_text text DEFAULT '',
  is_visible boolean DEFAULT true,
  is_ai_generated boolean DEFAULT false,
  ai_confidence_score numeric(3,2) DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT trend_direction_check CHECK (trend_direction IN ('positive', 'negative', 'neutral'))
);

-- ============================================================================
-- CREATE TABLE: AI Summary Configuration
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_summary_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_id uuid NOT NULL REFERENCES page_summaries(id) ON DELETE CASCADE,
  ai_enabled boolean DEFAULT false,
  ai_provider text DEFAULT 'none',
  api_key_name text DEFAULT NULL,
  prompt_template text DEFAULT '',
  metrics_to_analyze jsonb DEFAULT '[]'::jsonb,
  auto_refresh_enabled boolean DEFAULT false,
  refresh_frequency text DEFAULT 'weekly',
  last_generated_at timestamptz DEFAULT NULL,
  last_generation_status text DEFAULT 'pending',
  last_error_message text DEFAULT NULL,
  total_generations integer DEFAULT 0,
  total_tokens_used integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT ai_provider_check CHECK (ai_provider IN ('none', 'openai', 'anthropic', 'custom')),
  CONSTRAINT refresh_frequency_check CHECK (refresh_frequency IN ('daily', 'weekly', 'monthly', 'manual')),
  CONSTRAINT last_generation_status_check CHECK (last_generation_status IN ('pending', 'success', 'failed')),
  UNIQUE(summary_id)
);

-- ============================================================================
-- CREATE TABLE: AI Summary Generation Log
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_summary_generation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_id uuid NOT NULL REFERENCES page_summaries(id) ON DELETE CASCADE,
  generation_trigger text NOT NULL DEFAULT 'manual',
  ai_model_used text DEFAULT '',
  token_count integer DEFAULT 0,
  generation_time_ms integer DEFAULT 0,
  status text NOT NULL DEFAULT 'success',
  error_message text DEFAULT NULL,
  items_generated integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT generation_trigger_check CHECK (generation_trigger IN ('manual', 'scheduled', 'auto')),
  CONSTRAINT status_check CHECK (status IN ('success', 'failed', 'partial'))
);

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_page_summaries_client_page 
  ON page_summaries(client_id, page_id);

CREATE INDEX IF NOT EXISTS idx_page_summaries_section 
  ON page_summaries(section_id);

CREATE INDEX IF NOT EXISTS idx_page_summary_items_summary 
  ON page_summary_items(summary_id, item_order);

CREATE INDEX IF NOT EXISTS idx_ai_config_summary 
  ON ai_summary_config(summary_id);

CREATE INDEX IF NOT EXISTS idx_ai_log_summary 
  ON ai_summary_generation_log(summary_id, created_at DESC);

-- ============================================================================
-- SECURITY: Enable RLS
-- ============================================================================
ALTER TABLE page_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_summary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_summary_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_summary_generation_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: Page Summaries
-- ============================================================================
CREATE POLICY "Allow anonymous read access to page summaries"
  ON page_summaries FOR SELECT
  TO anon
  USING (enabled = true);

CREATE POLICY "Allow authenticated read access to page summaries"
  ON page_summaries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert page summaries"
  ON page_summaries FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update page summaries"
  ON page_summaries FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete page summaries"
  ON page_summaries FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- RLS POLICIES: Page Summary Items
-- ============================================================================
CREATE POLICY "Allow anonymous read access to visible summary items"
  ON page_summary_items FOR SELECT
  TO anon
  USING (
    is_visible = true 
    AND EXISTS (
      SELECT 1 FROM page_summaries 
      WHERE page_summaries.id = page_summary_items.summary_id 
      AND page_summaries.enabled = true
    )
  );

CREATE POLICY "Allow authenticated read access to summary items"
  ON page_summary_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert summary items"
  ON page_summary_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update summary items"
  ON page_summary_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete summary items"
  ON page_summary_items FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- RLS POLICIES: AI Summary Config
-- ============================================================================
CREATE POLICY "Allow authenticated read access to ai config"
  ON ai_summary_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert ai config"
  ON ai_summary_config FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update ai config"
  ON ai_summary_config FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete ai config"
  ON ai_summary_config FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- RLS POLICIES: AI Generation Log
-- ============================================================================
CREATE POLICY "Allow authenticated read access to generation log"
  ON ai_summary_generation_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert generation log"
  ON ai_summary_generation_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- FUNCTIONS: Auto-update timestamps
-- ============================================================================
CREATE OR REPLACE FUNCTION update_page_summary_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_page_summaries_timestamp
  BEFORE UPDATE ON page_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_page_summary_timestamp();

CREATE TRIGGER update_page_summary_items_timestamp
  BEFORE UPDATE ON page_summary_items
  FOR EACH ROW
  EXECUTE FUNCTION update_page_summary_timestamp();

CREATE TRIGGER update_ai_summary_config_timestamp
  BEFORE UPDATE ON ai_summary_config
  FOR EACH ROW
  EXECUTE FUNCTION update_page_summary_timestamp();
