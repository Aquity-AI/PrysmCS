/*
  # Fix Broken Graphs and Create Dashboard Graphs for All Clients

  1. Fix apex-solutions Overview graphs with real metric UUIDs
  2. Create graphs for apex enrollment, financial, outcomes pages
  3. Create graphs for cascade-enterprises all pages
  4. Create graphs for summit-partners-group all pages
*/

-- ============================================
-- FIX EXISTING APEX-SOLUTIONS OVERVIEW GRAPHS
-- ============================================

UPDATE dashboard_graphs SET
  metric_ids = '["4c352d32-edb6-44d4-aad9-d78aa9d66aa2", "db2ea7bf-53a7-4428-9c73-261db8723b26"]'::jsonb,
  time_range = 'last_6_months',
  group_by = 'month',
  config = '{"colors": ["#06b6d4", "#14b8a6"], "height": 280, "show_grid": true, "show_legend": true}'::jsonb,
  updated_at = now()
WHERE id = '7ac27c3a-2617-442e-a1c0-a69731045ea3';

UPDATE dashboard_graphs SET
  metric_ids = '["eb9b75fb-0622-447a-ab01-9df690a27a56"]'::jsonb,
  time_range = 'last_6_months',
  group_by = 'month',
  config = '{"colors": ["#10b981"], "height": 280, "show_grid": true, "show_legend": false}'::jsonb,
  updated_at = now()
WHERE id = '770bbd20-1f3e-47b1-a251-50e9e64f63b6';

UPDATE dashboard_graphs SET
  metric_ids = '["d94cb89c-c924-47a1-a233-a6cbd71eb6de", "db2ea7bf-53a7-4428-9c73-261db8723b26"]'::jsonb,
  time_range = 'last_3_months',
  config = '{"colors": ["#06b6d4", "#14b8a6"], "height": 240, "show_legend": true}'::jsonb,
  updated_at = now()
WHERE id = 'ce193159-ee20-428d-a9ee-70b4d2e488f7';

UPDATE dashboard_graphs SET
  metric_ids = '["d94cb89c-c924-47a1-a233-a6cbd71eb6de"]'::jsonb,
  time_range = 'last_6_months',
  group_by = 'month',
  config = '{"colors": ["#f59e0b"], "height": 240, "show_grid": true}'::jsonb,
  updated_at = now()
WHERE id = '5e31b2b0-19e9-4c59-80f1-c489b46c2c6d';

UPDATE dashboard_graphs SET
  metric_ids = '["25974964-28f2-4b40-86fc-2aaa318699a3"]'::jsonb,
  goals = '{"target_value": 95, "label": "Satisfaction Target"}'::jsonb,
  config = '{"height": 280}'::jsonb,
  updated_at = now()
WHERE id = '691f090a-688f-467b-b1c4-e0124cd997a0';

-- ============================================
-- APEX-SOLUTIONS ENROLLMENT PAGE GRAPHS
-- ============================================
INSERT INTO dashboard_graphs (client_id, page_id, title, chart_type, size, metric_ids, time_range, group_by, display_order, enabled, config)
VALUES
  ('apex-solutions', 'enrollment', 'Enrollment Trend', 'line', 'full',
   '["4c352d32-edb6-44d4-aad9-d78aa9d66aa2", "41990475-2724-4d8c-b25c-9ae24f2e4f0a"]'::jsonb,
   'last_12_months', 'month', 0, true,
   '{"colors": ["#06b6d4", "#14b8a6"], "height": 320, "show_grid": true, "show_legend": true}'::jsonb),
  ('apex-solutions', 'enrollment', 'New Client Pipeline', 'bar', 'half',
   '["65c955e0-363c-47a7-8ddf-68b0b8e977e2"]'::jsonb,
   'last_6_months', 'month', 1, true,
   '{"colors": ["#3b82f6"], "height": 280, "show_grid": true}'::jsonb),
  ('apex-solutions', 'enrollment', 'Referral Performance', 'area', 'half',
   '["abf27910-1597-44c8-a660-d237d71f129c"]'::jsonb,
   'last_6_months', 'month', 2, true,
   '{"colors": ["#22c55e"], "height": 280, "show_grid": true}'::jsonb);

-- ============================================
-- APEX-SOLUTIONS FINANCIAL PAGE GRAPHS
-- ============================================
INSERT INTO dashboard_graphs (client_id, page_id, title, chart_type, size, metric_ids, time_range, group_by, display_order, enabled, config)
VALUES
  ('apex-solutions', 'financial', 'Revenue vs Operating Costs', 'area', 'full',
   '["eb9b75fb-0622-447a-ab01-9df690a27a56", "7f5ce8f0-c785-48ae-8ce9-f702cf75584c"]'::jsonb,
   'last_12_months', 'month', 0, true,
   '{"colors": ["#10b981", "#ef4444"], "height": 320, "show_grid": true, "show_legend": true}'::jsonb),
  ('apex-solutions', 'financial', 'Profit Margin Trend', 'line', 'half',
   '["e0b619d0-2717-407e-a121-d347503d6568"]'::jsonb,
   'last_12_months', 'month', 1, true,
   '{"colors": ["#10b981"], "height": 280, "show_grid": true}'::jsonb),
  ('apex-solutions', 'financial', 'Cost Efficiency', 'bar', 'half',
   '["2f8b6f46-a7e5-4762-a857-472adac42a7b", "6c30d2d6-5cd3-41ed-9704-b0d235a6b32b"]'::jsonb,
   'last_6_months', 'month', 2, true,
   '{"colors": ["#ef4444", "#06b6d4"], "height": 280, "show_grid": true, "show_legend": true}'::jsonb);

-- ============================================
-- APEX-SOLUTIONS OUTCOMES PAGE GRAPHS
-- ============================================
INSERT INTO dashboard_graphs (client_id, page_id, title, chart_type, size, metric_ids, time_range, group_by, display_order, enabled, config, goals)
VALUES
  ('apex-solutions', 'outcomes', 'Patient Satisfaction', 'area', 'half',
   '["25974964-28f2-4b40-86fc-2aaa318699a3"]'::jsonb,
   'last_12_months', 'month', 0, true,
   '{"colors": ["#06b6d4"], "height": 280, "show_grid": true}'::jsonb, NULL),
  ('apex-solutions', 'outcomes', 'Readmission Rate', 'line', 'half',
   '["425310da-42d8-432c-84bd-2f8f543516ce"]'::jsonb,
   'last_12_months', 'month', 1, true,
   '{"colors": ["#ef4444"], "height": 280, "show_grid": true}'::jsonb, NULL),
  ('apex-solutions', 'outcomes', 'Goal Achievement', 'progress', 'half',
   '["065dce37-016b-4211-8103-cc6271846cd9"]'::jsonb,
   NULL, NULL, 2, true,
   '{"height": 280}'::jsonb, '{"target_value": 95, "label": "Achievement Target"}'::jsonb),
  ('apex-solutions', 'outcomes', 'Support Volume', 'bar', 'half',
   '["4389c2f3-54f3-480d-9b64-094ede239102"]'::jsonb,
   'last_6_months', 'month', 3, true,
   '{"colors": ["#f59e0b"], "height": 280, "show_grid": true}'::jsonb, NULL);

-- ============================================
-- CASCADE-ENTERPRISES OVERVIEW PAGE GRAPHS
-- ============================================
INSERT INTO dashboard_graphs (client_id, page_id, title, chart_type, size, metric_ids, time_range, group_by, display_order, enabled, config, goals)
VALUES
  ('cascade-enterprises', 'overview', 'Enrollment & Engagement', 'area', 'half',
   '["186876b4-3bc6-4bcd-837b-b95bced93b7a", "d34a6c6e-8805-46dc-bea7-d957086f07af"]'::jsonb,
   'last_6_months', 'month', 0, true,
   '{"colors": ["#06b6d4", "#14b8a6"], "height": 280, "show_grid": true, "show_legend": true}'::jsonb, NULL),
  ('cascade-enterprises', 'overview', 'Revenue Overview', 'line', 'half',
   '["1eb84687-0ce1-4d8b-bd59-526f88ce40ab"]'::jsonb,
   'last_6_months', 'month', 1, true,
   '{"colors": ["#10b981"], "height": 280, "show_grid": true}'::jsonb, NULL),
  ('cascade-enterprises', 'overview', 'Service Distribution', 'donut', 'quarter',
   '["23fe89ca-525d-4f3c-a708-343e0d2ca979", "d34a6c6e-8805-46dc-bea7-d957086f07af"]'::jsonb,
   'last_3_months', NULL, 2, true,
   '{"colors": ["#06b6d4", "#14b8a6"], "height": 240, "show_legend": true}'::jsonb, NULL),
  ('cascade-enterprises', 'overview', 'Retention Tracking', 'bar', 'quarter',
   '["34469e7d-1bc4-4b54-8cb6-3b3bcd107c6f"]'::jsonb,
   'last_6_months', 'month', 3, true,
   '{"colors": ["#f59e0b"], "height": 240, "show_grid": true}'::jsonb, NULL),
  ('cascade-enterprises', 'overview', 'Satisfaction Target', 'progress', 'full',
   '["16c0d4c8-3995-4ac7-b448-b674e63dce5c"]'::jsonb,
   NULL, NULL, 4, true,
   '{"height": 280}'::jsonb, '{"target_value": 90, "label": "Satisfaction Goal"}'::jsonb);

-- ============================================
-- CASCADE-ENTERPRISES ENROLLMENT PAGE GRAPHS
-- ============================================
INSERT INTO dashboard_graphs (client_id, page_id, title, chart_type, size, metric_ids, time_range, group_by, display_order, enabled, config)
VALUES
  ('cascade-enterprises', 'enrollment', 'Monthly Enrollments', 'bar', 'full',
   '["186876b4-3bc6-4bcd-837b-b95bced93b7a", "37fd266d-c392-4eb6-bed6-8a4af1b8370b"]'::jsonb,
   'last_12_months', 'month', 0, true,
   '{"colors": ["#06b6d4", "#14b8a6"], "height": 320, "show_grid": true, "show_legend": true}'::jsonb),
  ('cascade-enterprises', 'enrollment', 'Referral Pipeline', 'line', 'half',
   '["7c7086e7-6080-4b1f-b7cd-e76a8a054c95", "5ea0bcd5-0995-4f5f-aa43-c3ca6d1ea0bf"]'::jsonb,
   'last_12_months', 'month', 1, true,
   '{"colors": ["#22c55e", "#3b82f6"], "height": 280, "show_grid": true, "show_legend": true}'::jsonb);

-- ============================================
-- CASCADE-ENTERPRISES FINANCIAL PAGE GRAPHS
-- ============================================
INSERT INTO dashboard_graphs (client_id, page_id, title, chart_type, size, metric_ids, time_range, group_by, display_order, enabled, config)
VALUES
  ('cascade-enterprises', 'financial', 'Revenue & Costs', 'line', 'full',
   '["1eb84687-0ce1-4d8b-bd59-526f88ce40ab", "52f919d8-9493-498a-be77-4fef5cc03e3b"]'::jsonb,
   'last_12_months', 'month', 0, true,
   '{"colors": ["#10b981", "#ef4444"], "height": 320, "show_grid": true, "show_legend": true}'::jsonb),
  ('cascade-enterprises', 'financial', 'Margin Analysis', 'area', 'half',
   '["35c09368-1401-4bf2-b704-285d9d9b4d79"]'::jsonb,
   'last_12_months', 'month', 1, true,
   '{"colors": ["#10b981"], "height": 280, "show_grid": true}'::jsonb),
  ('cascade-enterprises', 'financial', 'Revenue Per Client', 'bar', 'half',
   '["b3c0d4a9-d7b7-45b9-b267-740ab239c184"]'::jsonb,
   'last_6_months', 'month', 2, true,
   '{"colors": ["#06b6d4"], "height": 280, "show_grid": true}'::jsonb);

-- ============================================
-- CASCADE-ENTERPRISES OUTCOMES PAGE GRAPHS
-- ============================================
INSERT INTO dashboard_graphs (client_id, page_id, title, chart_type, size, metric_ids, time_range, group_by, display_order, enabled, config)
VALUES
  ('cascade-enterprises', 'outcomes', 'Patient Experience', 'area', 'full',
   '["16c0d4c8-3995-4ac7-b448-b674e63dce5c", "40a29df5-d620-447e-afe5-034b04dd85c8"]'::jsonb,
   'last_12_months', 'month', 0, true,
   '{"colors": ["#06b6d4", "#22c55e"], "height": 320, "show_grid": true, "show_legend": true}'::jsonb),
  ('cascade-enterprises', 'outcomes', 'Readmission Trend', 'line', 'half',
   '["cfedc143-5f3e-4b56-b60f-267610d291f4"]'::jsonb,
   'last_12_months', 'month', 1, true,
   '{"colors": ["#ef4444"], "height": 280, "show_grid": true}'::jsonb);

-- ============================================
-- SUMMIT-PARTNERS-GROUP OVERVIEW PAGE GRAPHS
-- ============================================
INSERT INTO dashboard_graphs (client_id, page_id, title, chart_type, size, metric_ids, time_range, group_by, display_order, enabled, config, goals)
VALUES
  ('summit-partners-group', 'overview', 'Growth Dashboard', 'area', 'half',
   '["8e8e37d1-b52b-4ae7-a9bc-9684813acc75", "2710e3c7-ef3d-4391-80ca-311e8bd4fd4c"]'::jsonb,
   'last_6_months', 'month', 0, true,
   '{"colors": ["#06b6d4", "#14b8a6"], "height": 280, "show_grid": true, "show_legend": true}'::jsonb, NULL),
  ('summit-partners-group', 'overview', 'Revenue Performance', 'bar', 'half',
   '["afb9eb99-e724-442b-948a-4b619cbe53ab"]'::jsonb,
   'last_6_months', 'month', 1, true,
   '{"colors": ["#10b981"], "height": 280, "show_grid": true}'::jsonb, NULL),
  ('summit-partners-group', 'overview', 'Service Mix', 'pie', 'quarter',
   '["8a927d0d-7700-4ad7-a067-34ddecd9a0b9", "8e8e37d1-b52b-4ae7-a9bc-9684813acc75", "2710e3c7-ef3d-4391-80ca-311e8bd4fd4c"]'::jsonb,
   'last_3_months', NULL, 2, true,
   '{"colors": ["#06b6d4", "#10b981", "#f59e0b"], "height": 240, "show_legend": true}'::jsonb, NULL),
  ('summit-partners-group', 'overview', 'Satisfaction Target', 'progress', 'quarter',
   '["4fd08c7e-9dad-4563-b189-b5c3ce13bf1a"]'::jsonb,
   NULL, NULL, 3, true,
   '{"height": 240}'::jsonb, '{"target_value": 90, "label": "Satisfaction Goal"}'::jsonb);

-- ============================================
-- SUMMIT-PARTNERS-GROUP ENROLLMENT PAGE GRAPHS
-- ============================================
INSERT INTO dashboard_graphs (client_id, page_id, title, chart_type, size, metric_ids, time_range, group_by, display_order, enabled, config)
VALUES
  ('summit-partners-group', 'enrollment', 'Enrollment Pipeline', 'area', 'full',
   '["8e8e37d1-b52b-4ae7-a9bc-9684813acc75"]'::jsonb,
   'last_12_months', 'month', 0, true,
   '{"colors": ["#06b6d4"], "height": 320, "show_grid": true}'::jsonb),
  ('summit-partners-group', 'enrollment', 'Referral Growth', 'line', 'half',
   '["79ae2172-1e7b-4f2d-8466-9e8244098565"]'::jsonb,
   'last_12_months', 'month', 1, true,
   '{"colors": ["#22c55e"], "height": 280, "show_grid": true}'::jsonb),
  ('summit-partners-group', 'enrollment', 'Pipeline Volume', 'bar', 'half',
   '["aec03127-a31f-41de-a816-fb061f5ecedc"]'::jsonb,
   'last_6_months', 'month', 2, true,
   '{"colors": ["#3b82f6"], "height": 280, "show_grid": true}'::jsonb);

-- ============================================
-- SUMMIT-PARTNERS-GROUP FINANCIAL PAGE GRAPHS
-- ============================================
INSERT INTO dashboard_graphs (client_id, page_id, title, chart_type, size, metric_ids, time_range, group_by, display_order, enabled, config)
VALUES
  ('summit-partners-group', 'financial', 'Financial Overview', 'bar', 'full',
   '["afb9eb99-e724-442b-948a-4b619cbe53ab", "0d0ea7df-fd23-4433-b468-d94c90ea1422"]'::jsonb,
   'last_12_months', 'month', 0, true,
   '{"colors": ["#10b981", "#ef4444"], "height": 320, "show_grid": true, "show_legend": true}'::jsonb),
  ('summit-partners-group', 'financial', 'Margin Trajectory', 'line', 'half',
   '["236dbc9e-9b33-47c2-ab65-fd57bd486666"]'::jsonb,
   'last_12_months', 'month', 1, true,
   '{"colors": ["#10b981"], "height": 280, "show_grid": true}'::jsonb);

-- ============================================
-- SUMMIT-PARTNERS-GROUP OUTCOMES PAGE GRAPHS
-- ============================================
INSERT INTO dashboard_graphs (client_id, page_id, title, chart_type, size, metric_ids, time_range, group_by, display_order, enabled, config)
VALUES
  ('summit-partners-group', 'outcomes', 'Patient Satisfaction', 'line', 'half',
   '["4fd08c7e-9dad-4563-b189-b5c3ce13bf1a"]'::jsonb,
   'last_12_months', 'month', 0, true,
   '{"colors": ["#06b6d4"], "height": 280, "show_grid": true}'::jsonb),
  ('summit-partners-group', 'outcomes', 'Readmission Tracking', 'area', 'half',
   '["b659b3f5-6070-4f65-be17-980331398526"]'::jsonb,
   'last_12_months', 'month', 1, true,
   '{"colors": ["#ef4444"], "height": 280, "show_grid": true}'::jsonb),
  ('summit-partners-group', 'outcomes', 'NPS Trend', 'bar', 'full',
   '["1a348355-cbda-45ed-8191-34653e5d964c"]'::jsonb,
   'last_12_months', 'month', 2, true,
   '{"colors": ["#14b8a6"], "height": 280, "show_grid": true}'::jsonb);
