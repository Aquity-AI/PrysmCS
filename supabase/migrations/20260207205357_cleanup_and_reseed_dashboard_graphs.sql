/*
  # Clean Up Dashboard Graphs and Seed All Pages

  1. Cleanup
    - Remove all existing dashboard_graphs for the 3 demo clients
    - Eliminates duplicate/excessive graphs (Apex had 9 overview graphs)

  2. New Graphs - Apex Solutions (19 total)
    - Overview (5): Revenue area, Enrollment+Retention line, Satisfaction progress, NPS bar, Revenue/Client bar
    - Enrollment (3): Enrollment+Growth line, Pipeline bar, Referral area
    - Financial (3): Revenue vs Costs area, Margin line, Unit Economics bar
    - Outcomes (4): Satisfaction area, Readmission line, Goal Achievement progress, Support bar
    - Stories (2): Satisfaction line, NPS bar - NEW PAGE
    - Opportunities (2): Pipeline bar, Acquisition Cost line - NEW PAGE

  3. New Graphs - Cascade Enterprises (18 total)
    - Overview (5): Enrollment+Engagement area, Revenue line, Satisfaction progress, Retention bar, Service donut
    - Enrollment (3): Enrollments bar, Referral+Pipeline line, Active Participants area
    - Financial (3): Revenue+Costs line, Margin area, Revenue/Client bar
    - Outcomes (3): Satisfaction+Goals area, Readmission line, Support bar
    - Stories (2): Satisfaction area, NPS line - NEW PAGE
    - Opportunities (2): Pipeline bar, Acquisition Cost area - NEW PAGE

  4. New Graphs - Summit Partners Group (18 total)
    - Overview (5): Growth area, Revenue bar, Service Mix pie, Satisfaction progress, Staff Utilization line
    - Enrollment (3): Enrollment area, Referral line, Pipeline bar
    - Financial (3): Revenue+Costs bar, Margin line, Revenue/Client area
    - Outcomes (3): Satisfaction line, Readmission area, NPS bar
    - Stories (2): Goal Achievement line, Satisfaction bar - NEW PAGE
    - Opportunities (2): Pipeline area, Referral line - NEW PAGE

  5. Goal Lines
    - Patient Satisfaction: 95% target
    - Goal Achievement: 90% target
    - Profit Margin: 25% target (Apex), 22% (Cascade), 20% (Summit)
    - Staff Utilization: 85% target

  6. Notes
    - All metric_ids reference verified UUIDs from metric_definitions
    - All time_range values ensure data overlap with NOW()-relative historical data
    - Chart type variety across pages and clients for visual interest
    - Each graph uses curated color palettes
*/

-- Step 1: Remove all existing demo client graphs
DELETE FROM dashboard_graphs
WHERE client_id IN ('apex-solutions', 'cascade-enterprises', 'summit-partners-group');

-- ============================================
-- APEX SOLUTIONS
-- ============================================

-- Overview
INSERT INTO dashboard_graphs (client_id, page_id, title, chart_type, size, metric_ids, time_range, display_order, goals, config) VALUES
('apex-solutions', 'overview', 'Revenue Trend', 'area', 'full',
  '["eb9b75fb-0622-447a-ab01-9df690a27a56"]'::jsonb,
  'last_12_months', 0, NULL,
  '{"colors": ["#0ea5e9", "#38bdf8"]}'::jsonb),

('apex-solutions', 'overview', 'Enrollment & Retention', 'line', 'half',
  '["4c352d32-edb6-44d4-aad9-d78aa9d66aa2", "18cf92f4-6185-4020-a8f5-b0e9519621e7"]'::jsonb,
  'last_6_months', 1, NULL,
  '{"colors": ["#06b6d4", "#14b8a6"]}'::jsonb),

('apex-solutions', 'overview', 'Patient Satisfaction', 'progress', 'quarter',
  '["25974964-28f2-4b40-86fc-2aaa318699a3"]'::jsonb,
  NULL, 2,
  '[{"metricId": "25974964-28f2-4b40-86fc-2aaa318699a3", "value": 95, "label": "Target", "color": "#10b981"}]'::jsonb,
  '{"colors": ["#10b981"]}'::jsonb),

('apex-solutions', 'overview', 'Net Promoter Score', 'bar', 'quarter',
  '["326537e5-e89a-4606-829a-1e2090c6123e"]'::jsonb,
  'last_6_months', 3, NULL,
  '{"colors": ["#f59e0b"]}'::jsonb),

('apex-solutions', 'overview', 'Revenue Per Client', 'bar', 'half',
  '["6c30d2d6-5cd3-41ed-9704-b0d235a6b32b"]'::jsonb,
  'last_12_months', 4, NULL,
  '{"colors": ["#0ea5e9"]}'::jsonb);

-- Enrollment
INSERT INTO dashboard_graphs (client_id, page_id, title, chart_type, size, metric_ids, time_range, display_order, goals, config) VALUES
('apex-solutions', 'enrollment', 'Enrollment & Growth Rate', 'line', 'full',
  '["4c352d32-edb6-44d4-aad9-d78aa9d66aa2", "41990475-2724-4d8c-b25c-9ae24f2e4f0a"]'::jsonb,
  'last_12_months', 0, NULL,
  '{"colors": ["#06b6d4", "#14b8a6"]}'::jsonb),

('apex-solutions', 'enrollment', 'Client Pipeline', 'bar', 'half',
  '["65c955e0-363c-47a7-8ddf-68b0b8e977e2"]'::jsonb,
  'last_6_months', 1, NULL,
  '{"colors": ["#3b82f6"]}'::jsonb),

('apex-solutions', 'enrollment', 'Referral Performance', 'area', 'half',
  '["abf27910-1597-44c8-a660-d237d71f129c"]'::jsonb,
  'last_6_months', 2, NULL,
  '{"colors": ["#14b8a6"]}'::jsonb);

-- Financial
INSERT INTO dashboard_graphs (client_id, page_id, title, chart_type, size, metric_ids, time_range, display_order, goals, config) VALUES
('apex-solutions', 'financial', 'Revenue vs Operating Costs', 'area', 'full',
  '["eb9b75fb-0622-447a-ab01-9df690a27a56", "7f5ce8f0-c785-48ae-8ce9-f702cf75584c"]'::jsonb,
  'last_12_months', 0, NULL,
  '{"colors": ["#10b981", "#ef4444"]}'::jsonb),

('apex-solutions', 'financial', 'Profit Margin Trend', 'line', 'half',
  '["e0b619d0-2717-407e-a121-d347503d6568"]'::jsonb,
  'last_12_months', 1,
  '[{"metricId": "e0b619d0-2717-407e-a121-d347503d6568", "value": 25, "label": "Target 25%", "color": "#10b981"}]'::jsonb,
  '{"colors": ["#0ea5e9"]}'::jsonb),

('apex-solutions', 'financial', 'Unit Economics', 'bar', 'half',
  '["2f8b6f46-a7e5-4762-a857-472adac42a7b", "6c30d2d6-5cd3-41ed-9704-b0d235a6b32b"]'::jsonb,
  'last_6_months', 2, NULL,
  '{"colors": ["#ef4444", "#10b981"]}'::jsonb);

-- Outcomes
INSERT INTO dashboard_graphs (client_id, page_id, title, chart_type, size, metric_ids, time_range, display_order, goals, config) VALUES
('apex-solutions', 'outcomes', 'Patient Satisfaction', 'area', 'half',
  '["25974964-28f2-4b40-86fc-2aaa318699a3"]'::jsonb,
  'last_12_months', 0,
  '[{"metricId": "25974964-28f2-4b40-86fc-2aaa318699a3", "value": 95, "label": "Target", "color": "#10b981"}]'::jsonb,
  '{"colors": ["#10b981"]}'::jsonb),

('apex-solutions', 'outcomes', 'Readmission Rate', 'line', 'half',
  '["425310da-42d8-432c-84bd-2f8f543516ce"]'::jsonb,
  'last_12_months', 1,
  '[{"metricId": "425310da-42d8-432c-84bd-2f8f543516ce", "value": 5, "label": "Target < 5%", "color": "#f59e0b"}]'::jsonb,
  '{"colors": ["#ef4444"]}'::jsonb),

('apex-solutions', 'outcomes', 'Goal Achievement', 'progress', 'half',
  '["065dce37-016b-4211-8103-cc6271846cd9"]'::jsonb,
  NULL, 2,
  '[{"metricId": "065dce37-016b-4211-8103-cc6271846cd9", "value": 90, "label": "Target 90%", "color": "#10b981"}]'::jsonb,
  '{"colors": ["#06b6d4"]}'::jsonb),

('apex-solutions', 'outcomes', 'Support Volume', 'bar', 'half',
  '["4389c2f3-54f3-480d-9b64-094ede239102"]'::jsonb,
  'last_6_months', 3, NULL,
  '{"colors": ["#f59e0b"]}'::jsonb);

-- Stories
INSERT INTO dashboard_graphs (client_id, page_id, title, chart_type, size, metric_ids, time_range, display_order, goals, config) VALUES
('apex-solutions', 'stories', 'Satisfaction Journey', 'line', 'half',
  '["25974964-28f2-4b40-86fc-2aaa318699a3"]'::jsonb,
  'last_12_months', 0, NULL,
  '{"colors": ["#10b981"]}'::jsonb),

('apex-solutions', 'stories', 'NPS Growth', 'bar', 'half',
  '["326537e5-e89a-4606-829a-1e2090c6123e"]'::jsonb,
  'last_6_months', 1, NULL,
  '{"colors": ["#f59e0b"]}'::jsonb);

-- Opportunities
INSERT INTO dashboard_graphs (client_id, page_id, title, chart_type, size, metric_ids, time_range, display_order, goals, config) VALUES
('apex-solutions', 'opportunities', 'Pipeline Volume', 'bar', 'half',
  '["65c955e0-363c-47a7-8ddf-68b0b8e977e2"]'::jsonb,
  'last_6_months', 0, NULL,
  '{"colors": ["#3b82f6"]}'::jsonb),

('apex-solutions', 'opportunities', 'Acquisition Efficiency', 'line', 'half',
  '["2f8b6f46-a7e5-4762-a857-472adac42a7b"]'::jsonb,
  'last_12_months', 1, NULL,
  '{"colors": ["#ef4444"]}'::jsonb);


-- ============================================
-- CASCADE ENTERPRISES
-- ============================================

-- Overview
INSERT INTO dashboard_graphs (client_id, page_id, title, chart_type, size, metric_ids, time_range, display_order, goals, config) VALUES
('cascade-enterprises', 'overview', 'Enrollment & Engagement', 'area', 'full',
  '["186876b4-3bc6-4bcd-837b-b95bced93b7a", "d34a6c6e-8805-46dc-bea7-d957086f07af"]'::jsonb,
  'last_12_months', 0, NULL,
  '{"colors": ["#06b6d4", "#14b8a6"]}'::jsonb),

('cascade-enterprises', 'overview', 'Revenue Performance', 'line', 'half',
  '["1eb84687-0ce1-4d8b-bd59-526f88ce40ab"]'::jsonb,
  'last_6_months', 1, NULL,
  '{"colors": ["#10b981"]}'::jsonb),

('cascade-enterprises', 'overview', 'Satisfaction Target', 'progress', 'quarter',
  '["16c0d4c8-3995-4ac7-b448-b674e63dce5c"]'::jsonb,
  NULL, 2,
  '[{"metricId": "16c0d4c8-3995-4ac7-b448-b674e63dce5c", "value": 92, "label": "Target 92%", "color": "#10b981"}]'::jsonb,
  '{"colors": ["#10b981"]}'::jsonb),

('cascade-enterprises', 'overview', 'Retention Rate', 'bar', 'quarter',
  '["34469e7d-1bc4-4b54-8cb6-3b3bcd107c6f"]'::jsonb,
  'last_6_months', 3, NULL,
  '{"colors": ["#3b82f6"]}'::jsonb),

('cascade-enterprises', 'overview', 'Service Distribution', 'donut', 'half',
  '["23fe89ca-525d-4f3c-a708-343e0d2ca979", "d34a6c6e-8805-46dc-bea7-d957086f07af"]'::jsonb,
  'last_3_months', 4, NULL,
  '{"colors": ["#06b6d4", "#14b8a6"]}'::jsonb);

-- Enrollment
INSERT INTO dashboard_graphs (client_id, page_id, title, chart_type, size, metric_ids, time_range, display_order, goals, config) VALUES
('cascade-enterprises', 'enrollment', 'Monthly Enrollments', 'bar', 'full',
  '["186876b4-3bc6-4bcd-837b-b95bced93b7a", "37fd266d-c392-4eb6-bed6-8a4af1b8370b"]'::jsonb,
  'last_12_months', 0, NULL,
  '{"colors": ["#06b6d4", "#f59e0b"]}'::jsonb),

('cascade-enterprises', 'enrollment', 'Referral Pipeline', 'line', 'half',
  '["7c7086e7-6080-4b1f-b7cd-e76a8a054c95", "5ea0bcd5-0995-4f5f-aa43-c3ca6d1ea0bf"]'::jsonb,
  'last_12_months', 1, NULL,
  '{"colors": ["#14b8a6", "#3b82f6"]}'::jsonb),

('cascade-enterprises', 'enrollment', 'Active Participants', 'area', 'half',
  '["d34a6c6e-8805-46dc-bea7-d957086f07af"]'::jsonb,
  'last_6_months', 2, NULL,
  '{"colors": ["#06b6d4"]}'::jsonb);

-- Financial
INSERT INTO dashboard_graphs (client_id, page_id, title, chart_type, size, metric_ids, time_range, display_order, goals, config) VALUES
('cascade-enterprises', 'financial', 'Revenue & Costs', 'line', 'full',
  '["1eb84687-0ce1-4d8b-bd59-526f88ce40ab", "52f919d8-9493-498a-be77-4fef5cc03e3b"]'::jsonb,
  'last_12_months', 0, NULL,
  '{"colors": ["#10b981", "#ef4444"]}'::jsonb),

('cascade-enterprises', 'financial', 'Margin Analysis', 'area', 'half',
  '["35c09368-1401-4bf2-b704-285d9d9b4d79"]'::jsonb,
  'last_12_months', 1,
  '[{"metricId": "35c09368-1401-4bf2-b704-285d9d9b4d79", "value": 22, "label": "Target 22%", "color": "#10b981"}]'::jsonb,
  '{"colors": ["#0ea5e9"]}'::jsonb),

('cascade-enterprises', 'financial', 'Revenue Per Client', 'bar', 'half',
  '["b3c0d4a9-d7b7-45b9-b267-740ab239c184"]'::jsonb,
  'last_6_months', 2, NULL,
  '{"colors": ["#10b981"]}'::jsonb);

-- Outcomes
INSERT INTO dashboard_graphs (client_id, page_id, title, chart_type, size, metric_ids, time_range, display_order, goals, config) VALUES
('cascade-enterprises', 'outcomes', 'Patient Experience', 'area', 'half',
  '["16c0d4c8-3995-4ac7-b448-b674e63dce5c", "40a29df5-d620-447e-afe5-034b04dd85c8"]'::jsonb,
  'last_12_months', 0, NULL,
  '{"colors": ["#10b981", "#06b6d4"]}'::jsonb),

('cascade-enterprises', 'outcomes', 'Readmission Trend', 'line', 'half',
  '["cfedc143-5f3e-4b56-b60f-267610d291f4"]'::jsonb,
  'last_12_months', 1,
  '[{"metricId": "cfedc143-5f3e-4b56-b60f-267610d291f4", "value": 6, "label": "Target < 6%", "color": "#f59e0b"}]'::jsonb,
  '{"colors": ["#ef4444"]}'::jsonb),

('cascade-enterprises', 'outcomes', 'Support Volume', 'bar', 'half',
  '["21334239-fc4c-4a34-b0f7-ac26433224a0"]'::jsonb,
  'last_6_months', 2, NULL,
  '{"colors": ["#f59e0b"]}'::jsonb);

-- Stories
INSERT INTO dashboard_graphs (client_id, page_id, title, chart_type, size, metric_ids, time_range, display_order, goals, config) VALUES
('cascade-enterprises', 'stories', 'Patient Satisfaction Journey', 'area', 'half',
  '["16c0d4c8-3995-4ac7-b448-b674e63dce5c"]'::jsonb,
  'last_12_months', 0, NULL,
  '{"colors": ["#10b981"]}'::jsonb),

('cascade-enterprises', 'stories', 'NPS Trend', 'line', 'half',
  '["9f67b5cd-6395-4876-910d-53666b312a4a"]'::jsonb,
  'last_6_months', 1, NULL,
  '{"colors": ["#f59e0b"]}'::jsonb);

-- Opportunities
INSERT INTO dashboard_graphs (client_id, page_id, title, chart_type, size, metric_ids, time_range, display_order, goals, config) VALUES
('cascade-enterprises', 'opportunities', 'Growth Pipeline', 'bar', 'half',
  '["5ea0bcd5-0995-4f5f-aa43-c3ca6d1ea0bf"]'::jsonb,
  'last_6_months', 0, NULL,
  '{"colors": ["#3b82f6"]}'::jsonb),

('cascade-enterprises', 'opportunities', 'Cost Per Acquisition', 'area', 'half',
  '["7e8db553-583a-4a23-b4c6-524f5519dc37"]'::jsonb,
  'last_12_months', 1, NULL,
  '{"colors": ["#ef4444"]}'::jsonb);


-- ============================================
-- SUMMIT PARTNERS GROUP
-- ============================================

-- Overview
INSERT INTO dashboard_graphs (client_id, page_id, title, chart_type, size, metric_ids, time_range, display_order, goals, config) VALUES
('summit-partners-group', 'overview', 'Growth Dashboard', 'area', 'half',
  '["8e8e37d1-b52b-4ae7-a9bc-9684813acc75", "2710e3c7-ef3d-4391-80ca-311e8bd4fd4c"]'::jsonb,
  'last_6_months', 0, NULL,
  '{"colors": ["#06b6d4", "#14b8a6"]}'::jsonb),

('summit-partners-group', 'overview', 'Revenue Performance', 'bar', 'half',
  '["afb9eb99-e724-442b-948a-4b619cbe53ab"]'::jsonb,
  'last_6_months', 1, NULL,
  '{"colors": ["#10b981"]}'::jsonb),

('summit-partners-group', 'overview', 'Service Mix', 'pie', 'quarter',
  '["8a927d0d-7700-4ad7-a067-34ddecd9a0b9", "8e8e37d1-b52b-4ae7-a9bc-9684813acc75", "2710e3c7-ef3d-4391-80ca-311e8bd4fd4c"]'::jsonb,
  'last_3_months', 2, NULL,
  '{"colors": ["#06b6d4", "#14b8a6", "#f59e0b"]}'::jsonb),

('summit-partners-group', 'overview', 'Satisfaction Target', 'progress', 'quarter',
  '["4fd08c7e-9dad-4563-b189-b5c3ce13bf1a"]'::jsonb,
  NULL, 3,
  '[{"metricId": "4fd08c7e-9dad-4563-b189-b5c3ce13bf1a", "value": 93, "label": "Target 93%", "color": "#10b981"}]'::jsonb,
  '{"colors": ["#10b981"]}'::jsonb),

('summit-partners-group', 'overview', 'Staff Utilization', 'line', 'full',
  '["c97af57a-9a7a-4f52-af76-ecfa21683dca"]'::jsonb,
  'last_12_months', 4,
  '[{"metricId": "c97af57a-9a7a-4f52-af76-ecfa21683dca", "value": 85, "label": "Target 85%", "color": "#10b981"}]'::jsonb,
  '{"colors": ["#3b82f6"]}'::jsonb);

-- Enrollment
INSERT INTO dashboard_graphs (client_id, page_id, title, chart_type, size, metric_ids, time_range, display_order, goals, config) VALUES
('summit-partners-group', 'enrollment', 'Enrollment Pipeline', 'area', 'full',
  '["8e8e37d1-b52b-4ae7-a9bc-9684813acc75"]'::jsonb,
  'last_12_months', 0, NULL,
  '{"colors": ["#06b6d4"]}'::jsonb),

('summit-partners-group', 'enrollment', 'Referral Growth', 'line', 'half',
  '["79ae2172-1e7b-4f2d-8466-9e8244098565"]'::jsonb,
  'last_12_months', 1, NULL,
  '{"colors": ["#14b8a6"]}'::jsonb),

('summit-partners-group', 'enrollment', 'Pipeline Volume', 'bar', 'half',
  '["aec03127-a31f-41de-a816-fb061f5ecedc"]'::jsonb,
  'last_6_months', 2, NULL,
  '{"colors": ["#3b82f6"]}'::jsonb);

-- Financial
INSERT INTO dashboard_graphs (client_id, page_id, title, chart_type, size, metric_ids, time_range, display_order, goals, config) VALUES
('summit-partners-group', 'financial', 'Financial Overview', 'bar', 'full',
  '["afb9eb99-e724-442b-948a-4b619cbe53ab", "0d0ea7df-fd23-4433-b468-d94c90ea1422"]'::jsonb,
  'last_12_months', 0, NULL,
  '{"colors": ["#10b981", "#ef4444"]}'::jsonb),

('summit-partners-group', 'financial', 'Margin Trajectory', 'line', 'half',
  '["236dbc9e-9b33-47c2-ab65-fd57bd486666"]'::jsonb,
  'last_12_months', 1,
  '[{"metricId": "236dbc9e-9b33-47c2-ab65-fd57bd486666", "value": 20, "label": "Target 20%", "color": "#10b981"}]'::jsonb,
  '{"colors": ["#0ea5e9"]}'::jsonb),

('summit-partners-group', 'financial', 'Revenue Per Client', 'area', 'half',
  '["9a8ba2dd-b5b3-40f9-aafb-9dbe33bc44d0"]'::jsonb,
  'last_6_months', 2, NULL,
  '{"colors": ["#10b981"]}'::jsonb);

-- Outcomes
INSERT INTO dashboard_graphs (client_id, page_id, title, chart_type, size, metric_ids, time_range, display_order, goals, config) VALUES
('summit-partners-group', 'outcomes', 'Patient Satisfaction', 'line', 'half',
  '["4fd08c7e-9dad-4563-b189-b5c3ce13bf1a"]'::jsonb,
  'last_12_months', 0,
  '[{"metricId": "4fd08c7e-9dad-4563-b189-b5c3ce13bf1a", "value": 93, "label": "Target", "color": "#10b981"}]'::jsonb,
  '{"colors": ["#10b981"]}'::jsonb),

('summit-partners-group', 'outcomes', 'Readmission Tracking', 'area', 'half',
  '["b659b3f5-6070-4f65-be17-980331398526"]'::jsonb,
  'last_12_months', 1,
  '[{"metricId": "b659b3f5-6070-4f65-be17-980331398526", "value": 7, "label": "Target < 7%", "color": "#f59e0b"}]'::jsonb,
  '{"colors": ["#ef4444"]}'::jsonb),

('summit-partners-group', 'outcomes', 'NPS Trend', 'bar', 'full',
  '["1a348355-cbda-45ed-8191-34653e5d964c"]'::jsonb,
  'last_12_months', 2, NULL,
  '{"colors": ["#f59e0b"]}'::jsonb);

-- Stories
INSERT INTO dashboard_graphs (client_id, page_id, title, chart_type, size, metric_ids, time_range, display_order, goals, config) VALUES
('summit-partners-group', 'stories', 'Goal Achievement Trend', 'line', 'half',
  '["58a2459c-4c12-42e0-87d2-2f3575a6297e"]'::jsonb,
  'last_12_months', 0,
  '[{"metricId": "58a2459c-4c12-42e0-87d2-2f3575a6297e", "value": 90, "label": "Target 90%", "color": "#10b981"}]'::jsonb,
  '{"colors": ["#06b6d4"]}'::jsonb),

('summit-partners-group', 'stories', 'Satisfaction Scores', 'bar', 'half',
  '["4fd08c7e-9dad-4563-b189-b5c3ce13bf1a"]'::jsonb,
  'last_6_months', 1, NULL,
  '{"colors": ["#10b981"]}'::jsonb);

-- Opportunities
INSERT INTO dashboard_graphs (client_id, page_id, title, chart_type, size, metric_ids, time_range, display_order, goals, config) VALUES
('summit-partners-group', 'opportunities', 'New Client Pipeline', 'area', 'half',
  '["aec03127-a31f-41de-a816-fb061f5ecedc"]'::jsonb,
  'last_6_months', 0, NULL,
  '{"colors": ["#3b82f6"]}'::jsonb),

('summit-partners-group', 'opportunities', 'Referral Rate Trend', 'line', 'half',
  '["79ae2172-1e7b-4f2d-8466-9e8244098565"]'::jsonb,
  'last_12_months', 1, NULL,
  '{"colors": ["#14b8a6"]}'::jsonb);