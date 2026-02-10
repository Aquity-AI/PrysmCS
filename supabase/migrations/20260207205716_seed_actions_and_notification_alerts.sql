/*
  # Seed Action Items for Cascade/Summit and Notification Alerts for All Demo Clients

  1. New Action Items
    - Cascade Enterprises: 8 action items (mix of Open, In Progress, Completed)
    - Summit Partners Group: 8 action items (mix of Open, In Progress, Completed)
    - Due dates range from past-due to upcoming

  2. Notification Alerts (9 total: 3 per client)
    - Each client gets: 1 overdue alert, 1 risk alert, 1 opportunity alert
    - All reference valid action_ids from success_planning_actions
    - Status: active (visible in notification bell)

  3. Notes
    - Alerts reference real action items with foreign key constraint
    - Mix of alert types showcases the notification system
    - Overdue alerts reference past-due actions
*/

-- ============================================
-- CASCADE ENTERPRISES - Action Items
-- ============================================
INSERT INTO success_planning_actions (id, client_id, title, description, assignee_name, due_date, priority, status, action_type)
VALUES
  ('c1a01001-0001-4000-a000-000000000001', 'cascade-enterprises',
   'Complete Q1 Operational Efficiency Audit',
   'Review and document operational workflows to identify bottlenecks and improvement areas',
   'Sarah Chen', '2026-01-25', 'High', 'Open', 'Standard'),

  ('c1a01001-0001-4000-a000-000000000002', 'cascade-enterprises',
   'Deploy Customer Feedback Portal v2',
   'Launch updated feedback collection system with automated sentiment analysis',
   'James Rodriguez', '2026-02-01', 'High', 'In Progress', 'Standard'),

  ('c1a01001-0001-4000-a000-000000000003', 'cascade-enterprises',
   'Finalize Staff Training Program for New CRM',
   'Create and deliver training materials for the new CRM platform rollout',
   'Lisa Park', '2026-02-10', 'Medium', 'Open', 'Standard'),

  ('c1a01001-0001-4000-a000-000000000004', 'cascade-enterprises',
   'Establish Monthly Client Health Check Process',
   'Design recurring health assessment workflow with automated scoring',
   'Sarah Chen', '2026-02-15', 'High', 'In Progress', 'Standard'),

  ('c1a01001-0001-4000-a000-000000000005', 'cascade-enterprises',
   'Review and Update SLA Targets',
   'Benchmark current SLAs against industry standards and propose updates',
   'James Rodriguez', '2026-02-20', 'Medium', 'Open', 'Standard'),

  ('c1a01001-0001-4000-a000-000000000006', 'cascade-enterprises',
   'Launch Retention Risk Early Warning System',
   'Implement automated alerts when client engagement drops below threshold',
   'Lisa Park', '2026-03-01', 'High', 'Open', 'Standard'),

  ('c1a01001-0001-4000-a000-000000000007', 'cascade-enterprises',
   'Complete Data Migration to New Analytics Platform',
   'Migrate historical client data to new BI tool with validation checks',
   'Sarah Chen', '2026-03-10', 'Medium', 'Open', 'Standard'),

  ('c1a01001-0001-4000-a000-000000000008', 'cascade-enterprises',
   'Develop Client Onboarding Playbook',
   'Standardize onboarding process with templates, checklists, and timelines',
   'James Rodriguez', '2026-03-15', 'Medium', 'Completed', 'Standard')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SUMMIT PARTNERS GROUP - Action Items
-- ============================================
INSERT INTO success_planning_actions (id, client_id, title, description, assignee_name, due_date, priority, status, action_type)
VALUES
  ('c1a02001-0001-4000-a000-000000000001', 'summit-partners-group',
   'Conduct Partner Satisfaction Survey',
   'Deploy annual partner satisfaction survey and compile results report',
   'Michael Torres', '2026-01-20', 'High', 'Open', 'Standard'),

  ('c1a02001-0001-4000-a000-000000000002', 'summit-partners-group',
   'Upgrade Partner Communication Platform',
   'Evaluate and implement improved partner collaboration tools',
   'Aisha Patel', '2026-02-05', 'High', 'In Progress', 'Standard'),

  ('c1a02001-0001-4000-a000-000000000003', 'summit-partners-group',
   'Build Partner Performance Dashboard',
   'Create self-service analytics dashboard for partner organizations',
   'David Kim', '2026-02-12', 'Medium', 'Open', 'Standard'),

  ('c1a02001-0001-4000-a000-000000000004', 'summit-partners-group',
   'Establish Quality Benchmarking Program',
   'Define quality metrics and benchmarks across partner network',
   'Michael Torres', '2026-02-18', 'High', 'In Progress', 'Standard'),

  ('c1a02001-0001-4000-a000-000000000005', 'summit-partners-group',
   'Review Partner Onboarding SLAs',
   'Audit current onboarding timelines and identify improvement areas',
   'Aisha Patel', '2026-02-25', 'Medium', 'Open', 'Standard'),

  ('c1a02001-0001-4000-a000-000000000006', 'summit-partners-group',
   'Launch Regional Partner Meetup Program',
   'Organize quarterly in-person networking events for partner organizations',
   'David Kim', '2026-03-01', 'Medium', 'Open', 'Standard'),

  ('c1a02001-0001-4000-a000-000000000007', 'summit-partners-group',
   'Implement Partner Resource Library',
   'Build centralized knowledge base with training materials and best practices',
   'Michael Torres', '2026-03-10', 'High', 'Open', 'Standard'),

  ('c1a02001-0001-4000-a000-000000000008', 'summit-partners-group',
   'Complete Annual Partner Agreement Renewals',
   'Process and finalize partner agreement renewals for the upcoming fiscal year',
   'Aisha Patel', '2026-03-15', 'High', 'Completed', 'Standard')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- NOTIFICATION ALERTS
-- ============================================

-- Apex Solutions alerts
INSERT INTO notification_alerts (action_id, client_id, client_name, alert_type, title, message, status)
VALUES
  ('5a2af648-50a5-4026-a82c-c3b1716215e8', 'apex-solutions', 'Apex Solutions',
   'overdue', 'Overdue: Q1 Business Review',
   'The action "Schedule Q1 Business Review with Dr. Martinez" is past its due date of Feb 15. This high-priority item needs immediate attention.',
   'active'),

  ('11bb9718-5918-4d00-bb1e-e6455ab2d34a', 'apex-solutions', 'Apex Solutions',
   'risk', 'At Risk: EHR Integration Spec',
   'The Epic EHR Integration Technical Spec was due Feb 20 and remains open. Delays could impact the Q2 integration timeline.',
   'active'),

  ('67ad8cb1-c3f0-4c6f-975b-38a3db558e9d', 'apex-solutions', 'Apex Solutions',
   'opportunity', 'Opportunity: Patient Satisfaction Survey',
   'Patient satisfaction scores have been trending upward. Launching the survey (due Mar 15) could capture strong testimonials for the success stories page.',
   'active');

-- Cascade Enterprises alerts
INSERT INTO notification_alerts (action_id, client_id, client_name, alert_type, title, message, status)
VALUES
  ('c1a01001-0001-4000-a000-000000000001', 'cascade-enterprises', 'Cascade Enterprises',
   'overdue', 'Overdue: Q1 Efficiency Audit',
   'The Q1 Operational Efficiency Audit was due Jan 25 and is still open. This audit is critical for identifying cost reduction opportunities.',
   'active'),

  ('c1a01001-0001-4000-a000-000000000006', 'cascade-enterprises', 'Cascade Enterprises',
   'risk', 'At Risk: Retention Warning System',
   'The Retention Risk Early Warning System launch is approaching. Without it, at-risk clients may not be identified until engagement drops significantly.',
   'active'),

  ('c1a01001-0001-4000-a000-000000000002', 'cascade-enterprises', 'Cascade Enterprises',
   'opportunity', 'Opportunity: Feedback Portal Launch',
   'The Customer Feedback Portal v2 is nearly complete. Once deployed, it will enable real-time sentiment tracking and improve NPS measurement.',
   'active');

-- Summit Partners Group alerts
INSERT INTO notification_alerts (action_id, client_id, client_name, alert_type, title, message, status)
VALUES
  ('c1a02001-0001-4000-a000-000000000001', 'summit-partners-group', 'Summit Partners Group',
   'overdue', 'Overdue: Partner Satisfaction Survey',
   'The annual Partner Satisfaction Survey was due Jan 20 and remains undeployed. Partner feedback is essential for renewal planning.',
   'active'),

  ('c1a02001-0001-4000-a000-000000000004', 'summit-partners-group', 'Summit Partners Group',
   'risk', 'At Risk: Quality Benchmarking',
   'The Quality Benchmarking Program establishment is in progress but approaching its deadline. Delays affect partner performance evaluation.',
   'active'),

  ('c1a02001-0001-4000-a000-000000000007', 'summit-partners-group', 'Summit Partners Group',
   'opportunity', 'Opportunity: Partner Resource Library',
   'Building the centralized resource library could significantly improve partner onboarding efficiency and reduce support ticket volume.',
   'active');