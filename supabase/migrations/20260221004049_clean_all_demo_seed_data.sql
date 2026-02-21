/*
  # Clean all demo/seed data for production

  This migration removes all seeded demo data from the database
  to prepare for a clean production environment.

  1. Tables cleaned:
    - `success_planning_overview` - Remove demo client records
    - `success_planning_health` - Remove demo health data
    - `success_planning_actions` - Remove demo action items
    - `success_stories` - Remove demo success stories
    - `strategic_priorities` - Remove demo priorities
    - `page_summaries` - Remove demo page summaries
    - `page_summary_items` - Remove demo summary items
    - `metric_definitions` - Remove demo metric definitions
    - `metric_categories` - Remove demo metric categories
    - `dashboard_graphs` - Remove demo graph configs
    - `notification_alerts` - Remove demo alerts
    - `platform_branding` - Remove demo branding
    - `audit_log` - Remove demo audit entries

  2. Important notes:
    - This is a one-time cleanup for moving to production
    - All tables remain intact with their schemas and RLS policies
    - New data can be added through the application UI
*/

DELETE FROM page_summary_items;
DELETE FROM page_summaries;
DELETE FROM metric_definitions;
DELETE FROM metric_categories;
DELETE FROM dashboard_graphs;
DELETE FROM notification_alerts;
DELETE FROM success_stories;
DELETE FROM strategic_priorities;
DELETE FROM success_planning_actions;
DELETE FROM success_planning_health;
DELETE FROM audit_log;
DELETE FROM success_planning_overview;
DELETE FROM platform_branding;
