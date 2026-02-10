-- Sample Time Series Chart Data
-- This script creates sample data to demonstrate the time-series chart functionality
--
-- IMPORTANT: Change 'apex-solutions' to your actual client_id before running
-- This file is for demonstration purposes only and should be customized for your data

-- ============================================================================
-- Sample Metric Definition: Monthly Enrollments
-- ============================================================================
INSERT INTO metric_definitions (
  client_id,
  metric_name,
  metric_key,
  data_type,
  category,
  source_type,
  unit,
  description,
  is_active
) VALUES (
  'apex-solutions',
  'Monthly Enrollments',
  'monthly_enrollments',
  'number',
  'enrollment',
  'manual',
  'patients',
  'Total number of new patient enrollments per month',
  true
) ON CONFLICT (client_id, metric_key) DO UPDATE SET
  metric_name = EXCLUDED.metric_name,
  data_type = EXCLUDED.data_type,
  category = EXCLUDED.category;

-- ============================================================================
-- Sample Historical Data: Last 12 Months of Enrollment Data
-- ============================================================================
DO $$
DECLARE
  metric_uuid uuid;
  base_date date := CURRENT_DATE - INTERVAL '11 months';
  i integer;
  enrollment_value numeric;
BEGIN
  -- Get the metric ID
  SELECT id INTO metric_uuid
  FROM metric_definitions
  WHERE client_id = 'apex-solutions' AND metric_key = 'monthly_enrollments';

  -- Insert 12 months of data with realistic growth trend
  FOR i IN 0..11 LOOP
    enrollment_value := 32 + (i * 2) + FLOOR(RANDOM() * 5);

    INSERT INTO historical_metric_data (
      metric_id,
      client_id,
      data_date,
      value,
      data_source
    ) VALUES (
      metric_uuid,
      'apex-solutions',
      base_date + (i || ' months')::interval,
      enrollment_value,
      'manual_entry'
    ) ON CONFLICT (metric_id, client_id, data_date) DO UPDATE SET
      value = EXCLUDED.value;
  END LOOP;
END $$;

-- ============================================================================
-- Sample Chart Section: Enrollment Trend Chart
-- ============================================================================
INSERT INTO chart_sections (
  client_id,
  page_id,
  section_id,
  title,
  subtitle,
  chart_type,
  time_range_preset,
  granularity,
  height,
  show_legend,
  show_grid,
  show_data_points,
  enabled
) VALUES (
  'apex-solutions',
  'overview',
  'enrollment-trend-chart',
  'Enrollment Trend',
  'Monthly enrollment performance over time',
  'line',
  'last_12_months',
  'monthly',
  300,
  true,
  true,
  true,
  true
) ON CONFLICT (client_id, page_id, section_id) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle;

-- ============================================================================
-- Link Metric to Chart
-- ============================================================================
DO $$
DECLARE
  chart_uuid uuid;
  metric_uuid uuid;
BEGIN
  -- Get the chart section ID
  SELECT id INTO chart_uuid
  FROM chart_sections
  WHERE client_id = 'apex-solutions' AND page_id = 'overview' AND section_id = 'enrollment-trend-chart';

  -- Get the metric ID
  SELECT id INTO metric_uuid
  FROM metric_definitions
  WHERE client_id = 'apex-solutions' AND metric_key = 'monthly_enrollments';

  -- Link metric to chart
  INSERT INTO chart_metrics (
    chart_section_id,
    metric_id,
    line_color,
    line_style,
    axis_position,
    show_in_legend,
    display_order
  ) VALUES (
    chart_uuid,
    metric_uuid,
    '#06b6d4',
    'solid',
    'left',
    true,
    0
  ) ON CONFLICT (chart_section_id, metric_id) DO UPDATE SET
    line_color = EXCLUDED.line_color;
END $$;

-- ============================================================================
-- Additional Sample Metrics for Multi-Line Charts
-- ============================================================================
INSERT INTO metric_definitions (
  client_id,
  metric_name,
  metric_key,
  data_type,
  category,
  source_type,
  unit,
  description,
  is_active
) VALUES
  (
    'apex-solutions',
    'Active Patients',
    'active_patients',
    'number',
    'engagement',
    'manual',
    'patients',
    'Total number of active patients in the program',
    true
  ),
  (
    'apex-solutions',
    'Monthly Revenue',
    'monthly_revenue',
    'currency',
    'financial',
    'manual',
    'dollars',
    'Total revenue generated per month',
    true
  )
ON CONFLICT (client_id, metric_key) DO UPDATE SET
  metric_name = EXCLUDED.metric_name;

-- ============================================================================
-- Historical Data for Active Patients
-- ============================================================================
DO $$
DECLARE
  metric_uuid uuid;
  base_date date := CURRENT_DATE - INTERVAL '11 months';
  i integer;
  patient_value numeric;
BEGIN
  SELECT id INTO metric_uuid
  FROM metric_definitions
  WHERE client_id = 'apex-solutions' AND metric_key = 'active_patients';

  FOR i IN 0..11 LOOP
    patient_value := 200 + (i * 15) + FLOOR(RANDOM() * 20);

    INSERT INTO historical_metric_data (
      metric_id,
      client_id,
      data_date,
      value,
      data_source
    ) VALUES (
      metric_uuid,
      'apex-solutions',
      base_date + (i || ' months')::interval,
      patient_value,
      'manual_entry'
    ) ON CONFLICT (metric_id, client_id, data_date) DO UPDATE SET
      value = EXCLUDED.value;
  END LOOP;
END $$;

-- ============================================================================
-- Historical Data for Monthly Revenue
-- ============================================================================
DO $$
DECLARE
  metric_uuid uuid;
  base_date date := CURRENT_DATE - INTERVAL '11 months';
  i integer;
  revenue_value numeric;
BEGIN
  SELECT id INTO metric_uuid
  FROM metric_definitions
  WHERE client_id = 'apex-solutions' AND metric_key = 'monthly_revenue';

  FOR i IN 0..11 LOOP
    revenue_value := 75000 + (i * 4000) + FLOOR(RANDOM() * 5000);

    INSERT INTO historical_metric_data (
      metric_id,
      client_id,
      data_date,
      value,
      data_source
    ) VALUES (
      metric_uuid,
      'apex-solutions',
      base_date + (i || ' months')::interval,
      revenue_value,
      'manual_entry'
    ) ON CONFLICT (metric_id, client_id, data_date) DO UPDATE SET
      value = EXCLUDED.value;
  END LOOP;
END $$;
