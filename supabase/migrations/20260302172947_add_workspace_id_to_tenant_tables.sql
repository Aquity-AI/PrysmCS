/*
  # Add workspace_id to all tenant-scoped tables

  1. Modified Tables (adding workspace_id column)
    - `app_users` - Users are now scoped to exactly one workspace
    - `success_planning_overview` - Client overview data
    - `success_planning_stakeholders` - Client stakeholders
    - `success_planning_team` - Internal team assignments
    - `success_planning_goals` - Client goals
    - `success_planning_actions` - Action items
    - `success_planning_activities` - Activity log
    - `success_planning_health` - Health scores
    - `success_planning_documents` - Uploaded documents
    - `success_stories` - Success stories
    - `dashboard_graphs` - Dashboard graph configs
    - `page_layouts` - Page layout configs
    - `metric_definitions` - Metric definitions
    - `historical_metric_data` - Historical metric data points
    - `metric_tracking_config` - Metric tracking configuration
    - `metric_categories` - Metric categories
    - `strategic_priorities` - Strategic priorities
    - `notification_alerts` - Notification alerts
    - `chart_sections` - Chart section configs
    - `chart_metrics` - Chart metric configs
    - `client_customizations` - Per-client customizations
    - `presentation_configs` - Presentation configs
    - `page_summaries` - Page summary configs
    - `page_summary_items` - Page summary items
    - `ai_summary_config` - AI summary configuration
    - `ai_summary_generation_log` - AI generation logs
    - `form_tab_state` - Form tab state
    - `form_notes` - Form notes
    - `section_preferences` - Section expand/collapse state
    - `audit_log` - Audit log entries
    - `client_restoration_log` - Client restoration history
    - `purge_log` - Purge history

  2. Notes
    - workspace_id is nullable initially to preserve existing data
    - Existing rows will get workspace_id assigned when workspaces are created
    - Indexes added for workspace_id on all tables for query performance
    - client_id remains as sub-entity identifier within a workspace
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_users' AND column_name = 'workspace_id') THEN
    ALTER TABLE app_users ADD COLUMN workspace_id uuid REFERENCES workspaces(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'success_planning_overview' AND column_name = 'workspace_id') THEN
    ALTER TABLE success_planning_overview ADD COLUMN workspace_id uuid REFERENCES workspaces(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'success_planning_stakeholders' AND column_name = 'workspace_id') THEN
    ALTER TABLE success_planning_stakeholders ADD COLUMN workspace_id uuid REFERENCES workspaces(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'success_planning_team' AND column_name = 'workspace_id') THEN
    ALTER TABLE success_planning_team ADD COLUMN workspace_id uuid REFERENCES workspaces(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'success_planning_goals' AND column_name = 'workspace_id') THEN
    ALTER TABLE success_planning_goals ADD COLUMN workspace_id uuid REFERENCES workspaces(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'success_planning_actions' AND column_name = 'workspace_id') THEN
    ALTER TABLE success_planning_actions ADD COLUMN workspace_id uuid REFERENCES workspaces(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'success_planning_activities' AND column_name = 'workspace_id') THEN
    ALTER TABLE success_planning_activities ADD COLUMN workspace_id uuid REFERENCES workspaces(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'success_planning_health' AND column_name = 'workspace_id') THEN
    ALTER TABLE success_planning_health ADD COLUMN workspace_id uuid REFERENCES workspaces(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'success_planning_documents' AND column_name = 'workspace_id') THEN
    ALTER TABLE success_planning_documents ADD COLUMN workspace_id uuid REFERENCES workspaces(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'success_stories' AND column_name = 'workspace_id') THEN
    ALTER TABLE success_stories ADD COLUMN workspace_id uuid REFERENCES workspaces(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dashboard_graphs' AND column_name = 'workspace_id') THEN
    ALTER TABLE dashboard_graphs ADD COLUMN workspace_id uuid REFERENCES workspaces(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'page_layouts' AND column_name = 'workspace_id') THEN
    ALTER TABLE page_layouts ADD COLUMN workspace_id uuid REFERENCES workspaces(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'metric_definitions' AND column_name = 'workspace_id') THEN
    ALTER TABLE metric_definitions ADD COLUMN workspace_id uuid REFERENCES workspaces(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'historical_metric_data' AND column_name = 'workspace_id') THEN
    ALTER TABLE historical_metric_data ADD COLUMN workspace_id uuid REFERENCES workspaces(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'metric_tracking_config' AND column_name = 'workspace_id') THEN
    ALTER TABLE metric_tracking_config ADD COLUMN workspace_id uuid REFERENCES workspaces(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'metric_categories' AND column_name = 'workspace_id') THEN
    ALTER TABLE metric_categories ADD COLUMN workspace_id uuid REFERENCES workspaces(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'strategic_priorities' AND column_name = 'workspace_id') THEN
    ALTER TABLE strategic_priorities ADD COLUMN workspace_id uuid REFERENCES workspaces(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_alerts' AND column_name = 'workspace_id') THEN
    ALTER TABLE notification_alerts ADD COLUMN workspace_id uuid REFERENCES workspaces(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chart_sections' AND column_name = 'workspace_id') THEN
    ALTER TABLE chart_sections ADD COLUMN workspace_id uuid REFERENCES workspaces(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chart_metrics' AND column_name = 'workspace_id') THEN
    ALTER TABLE chart_metrics ADD COLUMN workspace_id uuid REFERENCES workspaces(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_customizations' AND column_name = 'workspace_id') THEN
    ALTER TABLE client_customizations ADD COLUMN workspace_id uuid REFERENCES workspaces(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'presentation_configs' AND column_name = 'workspace_id') THEN
    ALTER TABLE presentation_configs ADD COLUMN workspace_id uuid REFERENCES workspaces(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'page_summaries' AND column_name = 'workspace_id') THEN
    ALTER TABLE page_summaries ADD COLUMN workspace_id uuid REFERENCES workspaces(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'page_summary_items' AND column_name = 'workspace_id') THEN
    ALTER TABLE page_summary_items ADD COLUMN workspace_id uuid REFERENCES workspaces(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_summary_config' AND column_name = 'workspace_id') THEN
    ALTER TABLE ai_summary_config ADD COLUMN workspace_id uuid REFERENCES workspaces(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_summary_generation_log' AND column_name = 'workspace_id') THEN
    ALTER TABLE ai_summary_generation_log ADD COLUMN workspace_id uuid REFERENCES workspaces(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'form_tab_state' AND column_name = 'workspace_id') THEN
    ALTER TABLE form_tab_state ADD COLUMN workspace_id uuid REFERENCES workspaces(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'form_notes' AND column_name = 'workspace_id') THEN
    ALTER TABLE form_notes ADD COLUMN workspace_id uuid REFERENCES workspaces(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'section_preferences' AND column_name = 'workspace_id') THEN
    ALTER TABLE section_preferences ADD COLUMN workspace_id uuid REFERENCES workspaces(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_log' AND column_name = 'workspace_id') THEN
    ALTER TABLE audit_log ADD COLUMN workspace_id uuid REFERENCES workspaces(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_restoration_log' AND column_name = 'workspace_id') THEN
    ALTER TABLE client_restoration_log ADD COLUMN workspace_id uuid REFERENCES workspaces(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purge_log' AND column_name = 'workspace_id') THEN
    ALTER TABLE purge_log ADD COLUMN workspace_id uuid REFERENCES workspaces(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_app_users_workspace_id ON app_users(workspace_id);
CREATE INDEX IF NOT EXISTS idx_spo_workspace_id ON success_planning_overview(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sp_stakeholders_workspace_id ON success_planning_stakeholders(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sp_team_workspace_id ON success_planning_team(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sp_goals_workspace_id ON success_planning_goals(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sp_actions_workspace_id ON success_planning_actions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sp_activities_workspace_id ON success_planning_activities(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sp_health_workspace_id ON success_planning_health(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sp_documents_workspace_id ON success_planning_documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_success_stories_workspace_id ON success_stories(workspace_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_graphs_workspace_id ON dashboard_graphs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_page_layouts_workspace_id ON page_layouts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_metric_definitions_workspace_id ON metric_definitions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_historical_metric_data_workspace_id ON historical_metric_data(workspace_id);
CREATE INDEX IF NOT EXISTS idx_metric_tracking_config_workspace_id ON metric_tracking_config(workspace_id);
CREATE INDEX IF NOT EXISTS idx_metric_categories_workspace_id ON metric_categories(workspace_id);
CREATE INDEX IF NOT EXISTS idx_strategic_priorities_workspace_id ON strategic_priorities(workspace_id);
CREATE INDEX IF NOT EXISTS idx_notification_alerts_workspace_id ON notification_alerts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_chart_sections_workspace_id ON chart_sections(workspace_id);
CREATE INDEX IF NOT EXISTS idx_chart_metrics_workspace_id ON chart_metrics(workspace_id);
CREATE INDEX IF NOT EXISTS idx_client_customizations_workspace_id ON client_customizations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_presentation_configs_workspace_id ON presentation_configs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_page_summaries_workspace_id ON page_summaries(workspace_id);
CREATE INDEX IF NOT EXISTS idx_page_summary_items_workspace_id ON page_summary_items(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_summary_config_workspace_id ON ai_summary_config(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_summary_gen_log_workspace_id ON ai_summary_generation_log(workspace_id);
CREATE INDEX IF NOT EXISTS idx_form_tab_state_workspace_id ON form_tab_state(workspace_id);
CREATE INDEX IF NOT EXISTS idx_form_notes_workspace_id ON form_notes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_section_preferences_workspace_id ON section_preferences(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_workspace_id ON audit_log(workspace_id);
CREATE INDEX IF NOT EXISTS idx_client_restoration_log_workspace_id ON client_restoration_log(workspace_id);
CREATE INDEX IF NOT EXISTS idx_purge_log_workspace_id ON purge_log(workspace_id);
