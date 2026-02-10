/*
  # Seed Page Summaries for Overview, Outcomes, Stories, and Opportunities

  1. Cleanup
    - Fix Apex Solutions financial page summary items (had test/junk data)

  2. New Page Summaries (12 total: 4 pages x 3 clients)
    - Overview, Outcomes, Stories, Opportunities for each demo client

  3. Page Summary Items (42 total new items)
    - Realistic values consistent with seeded historical metric data
    - Trend directions reflect each demo client narrative

  4. Notes
    - Apex Solutions: premium healthcare provider, strong growth
    - Cascade Enterprises: mid-market, optimizing operations
    - Summit Partners Group: large partner network, quality focused
*/

-- Fix Apex financial junk data
UPDATE page_summary_items
SET label = 'Monthly Revenue', metric_value = '$245,000', trend_direction = 'positive',
    description_text = 'Total monthly revenue across all service lines'
WHERE summary_id = '6dd9a451-baee-4de0-b256-02903158bae8' AND item_order = 0;

UPDATE page_summary_items
SET label = 'Operating Costs', metric_value = '$182,000', trend_direction = 'neutral',
    description_text = 'Monthly operating expenses including staff and facilities'
WHERE summary_id = '6dd9a451-baee-4de0-b256-02903158bae8' AND item_order = 1;

UPDATE page_summary_items
SET label = 'Profit Margin', metric_value = '25.7%', trend_direction = 'positive',
    description_text = 'Net profit margin trending above target'
WHERE summary_id = '6dd9a451-baee-4de0-b256-02903158bae8' AND item_order = 2;

UPDATE page_summary_items
SET label = 'Revenue Per Client', metric_value = '$2,180', trend_direction = 'positive',
    description_text = 'Average monthly revenue per active client'
WHERE summary_id = '6dd9a451-baee-4de0-b256-02903158bae8' AND item_order = 3;

-- Fix Apex enrollment summary items
UPDATE page_summary_items
SET label = 'New Enrollments', metric_value = '48', trend_direction = 'positive',
    description_text = 'New client enrollments this month'
WHERE summary_id = 'b02c8b91-207e-4818-b9be-04f1881cd6df' AND item_order = 0;

UPDATE page_summary_items
SET label = 'Growth Rate', metric_value = '8.2%', trend_direction = 'positive',
    description_text = 'Month-over-month enrollment growth rate'
WHERE summary_id = 'b02c8b91-207e-4818-b9be-04f1881cd6df' AND item_order = 1;

-- ============================================
-- APEX SOLUTIONS
-- ============================================

-- Overview
INSERT INTO page_summaries (client_id, page_id, section_id, title, subtitle, summary_mode, layout_style, max_items, enabled, display_order)
VALUES ('apex-solutions', 'overview', 'overview-summary', 'Key Performance Indicators', 'Current month highlights', 'manual', 'grid', 4, true, 0)
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  sid uuid;
BEGIN
  SELECT id INTO sid FROM page_summaries
  WHERE client_id = 'apex-solutions' AND page_id = 'overview' AND section_id = 'overview-summary';
  IF sid IS NOT NULL THEN
    INSERT INTO page_summary_items (summary_id, item_order, label, metric_value, trend_direction, description_text)
    VALUES
      (sid, 0, 'Active Clients', '112', 'positive', 'Total active client accounts'),
      (sid, 1, 'Monthly Revenue', '$245K', 'positive', 'Revenue up 4.2% from last month'),
      (sid, 2, 'Satisfaction Score', '93.4%', 'positive', 'Patient satisfaction above target'),
      (sid, 3, 'Retention Rate', '96.1%', 'positive', 'Industry-leading client retention')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Outcomes
INSERT INTO page_summaries (client_id, page_id, section_id, title, subtitle, summary_mode, layout_style, max_items, enabled, display_order)
VALUES ('apex-solutions', 'outcomes', 'outcomes-summary', 'Outcomes Overview', 'Quality and results metrics', 'manual', 'grid', 4, true, 0)
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  sid uuid;
BEGIN
  SELECT id INTO sid FROM page_summaries
  WHERE client_id = 'apex-solutions' AND page_id = 'outcomes' AND section_id = 'outcomes-summary';
  IF sid IS NOT NULL THEN
    INSERT INTO page_summary_items (summary_id, item_order, label, metric_value, trend_direction, description_text)
    VALUES
      (sid, 0, 'Satisfaction', '93.4%', 'positive', 'Patient satisfaction trending upward'),
      (sid, 1, 'Readmission', '4.8%', 'positive', 'Below 5% target for 3 consecutive months'),
      (sid, 2, 'Goal Achievement', '88.5%', 'positive', 'On track to meet 90% annual target'),
      (sid, 3, 'Avg Response Time', '2.1 hrs', 'positive', 'Improved from 3.4 hours last quarter')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Stories
INSERT INTO page_summaries (client_id, page_id, section_id, title, subtitle, summary_mode, layout_style, max_items, enabled, display_order)
VALUES ('apex-solutions', 'stories', 'stories-summary', 'Success Highlights', 'Impact metrics from recent wins', 'manual', 'grid', 3, true, 0)
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  sid uuid;
BEGIN
  SELECT id INTO sid FROM page_summaries
  WHERE client_id = 'apex-solutions' AND page_id = 'stories' AND section_id = 'stories-summary';
  IF sid IS NOT NULL THEN
    INSERT INTO page_summary_items (summary_id, item_order, label, metric_value, trend_direction, description_text)
    VALUES
      (sid, 0, 'Stories Shared', '8', 'positive', 'Client success stories published this quarter'),
      (sid, 1, 'NPS Score', '72', 'positive', 'Strong advocacy among existing clients'),
      (sid, 2, 'Client Referrals', '14', 'positive', 'Referrals generated from success stories')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Opportunities
INSERT INTO page_summaries (client_id, page_id, section_id, title, subtitle, summary_mode, layout_style, max_items, enabled, display_order)
VALUES ('apex-solutions', 'opportunities', 'opportunities-summary', 'Growth Opportunities', 'Pipeline and expansion metrics', 'manual', 'grid', 3, true, 0)
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  sid uuid;
BEGIN
  SELECT id INTO sid FROM page_summaries
  WHERE client_id = 'apex-solutions' AND page_id = 'opportunities' AND section_id = 'opportunities-summary';
  IF sid IS NOT NULL THEN
    INSERT INTO page_summary_items (summary_id, item_order, label, metric_value, trend_direction, description_text)
    VALUES
      (sid, 0, 'Pipeline Value', '42 leads', 'positive', 'Active prospects in the pipeline'),
      (sid, 1, 'Acquisition Cost', '$1,250', 'positive', 'Cost per acquisition down 8% from Q3'),
      (sid, 2, 'Referral Rate', '23.5%', 'positive', 'Growing referral channel contribution')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================
-- CASCADE ENTERPRISES
-- ============================================

-- Overview
INSERT INTO page_summaries (client_id, page_id, section_id, title, subtitle, summary_mode, layout_style, max_items, enabled, display_order)
VALUES ('cascade-enterprises', 'overview', 'overview-summary', 'Key Performance Indicators', 'Current month highlights', 'manual', 'grid', 4, true, 0)
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  sid uuid;
BEGIN
  SELECT id INTO sid FROM page_summaries
  WHERE client_id = 'cascade-enterprises' AND page_id = 'overview' AND section_id = 'overview-summary';
  IF sid IS NOT NULL THEN
    INSERT INTO page_summary_items (summary_id, item_order, label, metric_value, trend_direction, description_text)
    VALUES
      (sid, 0, 'Active Clients', '87', 'positive', 'Steady growth in active client base'),
      (sid, 1, 'Monthly Revenue', '$168K', 'positive', 'Revenue increased 3.1% month-over-month'),
      (sid, 2, 'Satisfaction Score', '90.2%', 'neutral', 'Stable satisfaction metrics'),
      (sid, 3, 'Retention Rate', '93.8%', 'positive', 'Retention improving steadily')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Outcomes
INSERT INTO page_summaries (client_id, page_id, section_id, title, subtitle, summary_mode, layout_style, max_items, enabled, display_order)
VALUES ('cascade-enterprises', 'outcomes', 'outcomes-summary', 'Outcomes Overview', 'Quality and results metrics', 'manual', 'grid', 4, true, 0)
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  sid uuid;
BEGIN
  SELECT id INTO sid FROM page_summaries
  WHERE client_id = 'cascade-enterprises' AND page_id = 'outcomes' AND section_id = 'outcomes-summary';
  IF sid IS NOT NULL THEN
    INSERT INTO page_summary_items (summary_id, item_order, label, metric_value, trend_direction, description_text)
    VALUES
      (sid, 0, 'Satisfaction', '90.2%', 'neutral', 'Stable patient satisfaction scores'),
      (sid, 1, 'Readmission', '6.3%', 'neutral', 'Working toward sub-6% target'),
      (sid, 2, 'Goal Achievement', '82.1%', 'positive', 'Improving quarter-over-quarter'),
      (sid, 3, 'Avg Response Time', '3.8 hrs', 'neutral', 'Response time stable, targeting improvement')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Stories
INSERT INTO page_summaries (client_id, page_id, section_id, title, subtitle, summary_mode, layout_style, max_items, enabled, display_order)
VALUES ('cascade-enterprises', 'stories', 'stories-summary', 'Success Highlights', 'Impact metrics from recent wins', 'manual', 'grid', 3, true, 0)
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  sid uuid;
BEGIN
  SELECT id INTO sid FROM page_summaries
  WHERE client_id = 'cascade-enterprises' AND page_id = 'stories' AND section_id = 'stories-summary';
  IF sid IS NOT NULL THEN
    INSERT INTO page_summary_items (summary_id, item_order, label, metric_value, trend_direction, description_text)
    VALUES
      (sid, 0, 'Stories Shared', '5', 'positive', 'Client success stories this quarter'),
      (sid, 1, 'NPS Score', '58', 'positive', 'NPS improving with operational changes'),
      (sid, 2, 'Client Referrals', '9', 'neutral', 'Referrals steady from success stories')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Opportunities
INSERT INTO page_summaries (client_id, page_id, section_id, title, subtitle, summary_mode, layout_style, max_items, enabled, display_order)
VALUES ('cascade-enterprises', 'opportunities', 'opportunities-summary', 'Growth Opportunities', 'Pipeline and expansion metrics', 'manual', 'grid', 3, true, 0)
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  sid uuid;
BEGIN
  SELECT id INTO sid FROM page_summaries
  WHERE client_id = 'cascade-enterprises' AND page_id = 'opportunities' AND section_id = 'opportunities-summary';
  IF sid IS NOT NULL THEN
    INSERT INTO page_summary_items (summary_id, item_order, label, metric_value, trend_direction, description_text)
    VALUES
      (sid, 0, 'Pipeline Value', '31 leads', 'positive', 'Growing prospect pipeline'),
      (sid, 1, 'Acquisition Cost', '$1,680', 'neutral', 'Working to reduce acquisition costs'),
      (sid, 2, 'Referral Rate', '18.2%', 'positive', 'Referral channel gaining traction')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================
-- SUMMIT PARTNERS GROUP
-- ============================================

-- Overview
INSERT INTO page_summaries (client_id, page_id, section_id, title, subtitle, summary_mode, layout_style, max_items, enabled, display_order)
VALUES ('summit-partners-group', 'overview', 'overview-summary', 'Key Performance Indicators', 'Current month highlights', 'manual', 'grid', 4, true, 0)
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  sid uuid;
BEGIN
  SELECT id INTO sid FROM page_summaries
  WHERE client_id = 'summit-partners-group' AND page_id = 'overview' AND section_id = 'overview-summary';
  IF sid IS NOT NULL THEN
    INSERT INTO page_summary_items (summary_id, item_order, label, metric_value, trend_direction, description_text)
    VALUES
      (sid, 0, 'Active Clients', '64', 'positive', 'Partner network expanding steadily'),
      (sid, 1, 'Monthly Revenue', '$117K', 'positive', 'Revenue up 2.8% month-over-month'),
      (sid, 2, 'Satisfaction Score', '91.8%', 'positive', 'Quality-first approach showing results'),
      (sid, 3, 'Retention Rate', '94.5%', 'positive', 'Strong partner retention rates')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Outcomes
INSERT INTO page_summaries (client_id, page_id, section_id, title, subtitle, summary_mode, layout_style, max_items, enabled, display_order)
VALUES ('summit-partners-group', 'outcomes', 'outcomes-summary', 'Outcomes Overview', 'Quality and results metrics', 'manual', 'grid', 4, true, 0)
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  sid uuid;
BEGIN
  SELECT id INTO sid FROM page_summaries
  WHERE client_id = 'summit-partners-group' AND page_id = 'outcomes' AND section_id = 'outcomes-summary';
  IF sid IS NOT NULL THEN
    INSERT INTO page_summary_items (summary_id, item_order, label, metric_value, trend_direction, description_text)
    VALUES
      (sid, 0, 'Satisfaction', '91.8%', 'positive', 'Consistently strong satisfaction scores'),
      (sid, 1, 'Readmission', '7.2%', 'neutral', 'On improvement trajectory toward 7% target'),
      (sid, 2, 'Goal Achievement', '85.3%', 'positive', 'Progressing toward 90% target'),
      (sid, 3, 'Avg Response Time', '2.9 hrs', 'positive', 'Response times improving steadily')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Stories
INSERT INTO page_summaries (client_id, page_id, section_id, title, subtitle, summary_mode, layout_style, max_items, enabled, display_order)
VALUES ('summit-partners-group', 'stories', 'stories-summary', 'Success Highlights', 'Impact metrics from recent wins', 'manual', 'grid', 3, true, 0)
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  sid uuid;
BEGIN
  SELECT id INTO sid FROM page_summaries
  WHERE client_id = 'summit-partners-group' AND page_id = 'stories' AND section_id = 'stories-summary';
  IF sid IS NOT NULL THEN
    INSERT INTO page_summary_items (summary_id, item_order, label, metric_value, trend_direction, description_text)
    VALUES
      (sid, 0, 'Stories Shared', '6', 'positive', 'Partner success stories this quarter'),
      (sid, 1, 'NPS Score', '65', 'positive', 'NPS growing with quality improvements'),
      (sid, 2, 'Partner Referrals', '11', 'positive', 'Strong partner advocacy channel')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Opportunities
INSERT INTO page_summaries (client_id, page_id, section_id, title, subtitle, summary_mode, layout_style, max_items, enabled, display_order)
VALUES ('summit-partners-group', 'opportunities', 'opportunities-summary', 'Growth Opportunities', 'Pipeline and expansion metrics', 'manual', 'grid', 3, true, 0)
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  sid uuid;
BEGIN
  SELECT id INTO sid FROM page_summaries
  WHERE client_id = 'summit-partners-group' AND page_id = 'opportunities' AND section_id = 'opportunities-summary';
  IF sid IS NOT NULL THEN
    INSERT INTO page_summary_items (summary_id, item_order, label, metric_value, trend_direction, description_text)
    VALUES
      (sid, 0, 'Pipeline Value', '24 leads', 'positive', 'Qualified prospects in pipeline'),
      (sid, 1, 'Acquisition Cost', '$2,050', 'neutral', 'Higher cost reflects partner model complexity'),
      (sid, 2, 'Referral Rate', '21.3%', 'positive', 'Partner referrals trending upward')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;