/*
  # Seed Realistic Historical Data for Apex Solutions

  Adds 12 months of time-series data (Aug 2024 - Jul 2025) for all metrics.
  Apex Solutions represents a high-performing, mature client with strong upward trends.

  Data profiles:
  - Revenue growing from ~$180K to ~$245K
  - Profit margins improving from 38% to 46%
  - Patient satisfaction climbing from 88% to 94%
  - NPS scores in the 72-82 range
  - Declining readmission rates (8% to 5%)
  - Natural monthly variance applied for realism
*/

-- Fill in missing months for existing metrics that only have 6 data points

-- Monthly Revenue: fill Feb-Jul 2025 (apex already has Aug 2024 - Jan 2025)
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  ('eb9b75fb-0622-447a-ab01-9df690a27a56', 'apex-solutions', '2025-02-01', 208500, 'manual_entry'),
  ('eb9b75fb-0622-447a-ab01-9df690a27a56', 'apex-solutions', '2025-03-01', 215200, 'manual_entry'),
  ('eb9b75fb-0622-447a-ab01-9df690a27a56', 'apex-solutions', '2025-04-01', 222800, 'manual_entry'),
  ('eb9b75fb-0622-447a-ab01-9df690a27a56', 'apex-solutions', '2025-05-01', 231400, 'manual_entry'),
  ('eb9b75fb-0622-447a-ab01-9df690a27a56', 'apex-solutions', '2025-06-01', 238600, 'manual_entry'),
  ('eb9b75fb-0622-447a-ab01-9df690a27a56', 'apex-solutions', '2025-07-01', 245100, 'manual_entry')
ON CONFLICT DO NOTHING;

-- Service Volume: fill Feb-Jul 2025
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  ('d94cb89c-c924-47a1-a233-a6cbd71eb6de', 'apex-solutions', '2025-02-01', 892, 'manual_entry'),
  ('d94cb89c-c924-47a1-a233-a6cbd71eb6de', 'apex-solutions', '2025-03-01', 918, 'manual_entry'),
  ('d94cb89c-c924-47a1-a233-a6cbd71eb6de', 'apex-solutions', '2025-04-01', 945, 'manual_entry'),
  ('d94cb89c-c924-47a1-a233-a6cbd71eb6de', 'apex-solutions', '2025-05-01', 963, 'manual_entry'),
  ('d94cb89c-c924-47a1-a233-a6cbd71eb6de', 'apex-solutions', '2025-06-01', 989, 'manual_entry'),
  ('d94cb89c-c924-47a1-a233-a6cbd71eb6de', 'apex-solutions', '2025-07-01', 1012, 'manual_entry')
ON CONFLICT DO NOTHING;

-- Enrollment Growth Rate: full 12 months
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  ('41990475-2724-4d8c-b25c-9ae24f2e4f0a', 'apex-solutions', '2024-08-01', 5.2, 'manual_entry'),
  ('41990475-2724-4d8c-b25c-9ae24f2e4f0a', 'apex-solutions', '2024-09-01', 5.5, 'manual_entry'),
  ('41990475-2724-4d8c-b25c-9ae24f2e4f0a', 'apex-solutions', '2024-10-01', 5.8, 'manual_entry'),
  ('41990475-2724-4d8c-b25c-9ae24f2e4f0a', 'apex-solutions', '2024-11-01', 5.4, 'manual_entry'),
  ('41990475-2724-4d8c-b25c-9ae24f2e4f0a', 'apex-solutions', '2024-12-01', 6.1, 'manual_entry'),
  ('41990475-2724-4d8c-b25c-9ae24f2e4f0a', 'apex-solutions', '2025-01-01', 6.4, 'manual_entry'),
  ('41990475-2724-4d8c-b25c-9ae24f2e4f0a', 'apex-solutions', '2025-02-01', 6.8, 'manual_entry'),
  ('41990475-2724-4d8c-b25c-9ae24f2e4f0a', 'apex-solutions', '2025-03-01', 7.0, 'manual_entry'),
  ('41990475-2724-4d8c-b25c-9ae24f2e4f0a', 'apex-solutions', '2025-04-01', 7.3, 'manual_entry'),
  ('41990475-2724-4d8c-b25c-9ae24f2e4f0a', 'apex-solutions', '2025-05-01', 7.6, 'manual_entry'),
  ('41990475-2724-4d8c-b25c-9ae24f2e4f0a', 'apex-solutions', '2025-06-01', 7.9, 'manual_entry'),
  ('41990475-2724-4d8c-b25c-9ae24f2e4f0a', 'apex-solutions', '2025-07-01', 8.1, 'manual_entry')
ON CONFLICT DO NOTHING;

-- Patient Retention Rate: full 12 months
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  ('18cf92f4-6185-4020-a8f5-b0e9519621e7', 'apex-solutions', '2024-08-01', 89.2, 'manual_entry'),
  ('18cf92f4-6185-4020-a8f5-b0e9519621e7', 'apex-solutions', '2024-09-01', 89.8, 'manual_entry'),
  ('18cf92f4-6185-4020-a8f5-b0e9519621e7', 'apex-solutions', '2024-10-01', 90.1, 'manual_entry'),
  ('18cf92f4-6185-4020-a8f5-b0e9519621e7', 'apex-solutions', '2024-11-01', 90.5, 'manual_entry'),
  ('18cf92f4-6185-4020-a8f5-b0e9519621e7', 'apex-solutions', '2024-12-01', 91.0, 'manual_entry'),
  ('18cf92f4-6185-4020-a8f5-b0e9519621e7', 'apex-solutions', '2025-01-01', 91.4, 'manual_entry'),
  ('18cf92f4-6185-4020-a8f5-b0e9519621e7', 'apex-solutions', '2025-02-01', 91.8, 'manual_entry'),
  ('18cf92f4-6185-4020-a8f5-b0e9519621e7', 'apex-solutions', '2025-03-01', 92.3, 'manual_entry'),
  ('18cf92f4-6185-4020-a8f5-b0e9519621e7', 'apex-solutions', '2025-04-01', 92.7, 'manual_entry'),
  ('18cf92f4-6185-4020-a8f5-b0e9519621e7', 'apex-solutions', '2025-05-01', 93.1, 'manual_entry'),
  ('18cf92f4-6185-4020-a8f5-b0e9519621e7', 'apex-solutions', '2025-06-01', 93.5, 'manual_entry'),
  ('18cf92f4-6185-4020-a8f5-b0e9519621e7', 'apex-solutions', '2025-07-01', 94.0, 'manual_entry')
ON CONFLICT DO NOTHING;

-- Operating Costs
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  ('7f5ce8f0-c785-48ae-8ce9-f702cf75584c', 'apex-solutions', '2024-08-01', 118500, 'manual_entry'),
  ('7f5ce8f0-c785-48ae-8ce9-f702cf75584c', 'apex-solutions', '2024-09-01', 120200, 'manual_entry'),
  ('7f5ce8f0-c785-48ae-8ce9-f702cf75584c', 'apex-solutions', '2024-10-01', 121800, 'manual_entry'),
  ('7f5ce8f0-c785-48ae-8ce9-f702cf75584c', 'apex-solutions', '2024-11-01', 123500, 'manual_entry'),
  ('7f5ce8f0-c785-48ae-8ce9-f702cf75584c', 'apex-solutions', '2024-12-01', 126200, 'manual_entry'),
  ('7f5ce8f0-c785-48ae-8ce9-f702cf75584c', 'apex-solutions', '2025-01-01', 128000, 'manual_entry'),
  ('7f5ce8f0-c785-48ae-8ce9-f702cf75584c', 'apex-solutions', '2025-02-01', 129500, 'manual_entry'),
  ('7f5ce8f0-c785-48ae-8ce9-f702cf75584c', 'apex-solutions', '2025-03-01', 131200, 'manual_entry'),
  ('7f5ce8f0-c785-48ae-8ce9-f702cf75584c', 'apex-solutions', '2025-04-01', 133800, 'manual_entry'),
  ('7f5ce8f0-c785-48ae-8ce9-f702cf75584c', 'apex-solutions', '2025-05-01', 135500, 'manual_entry'),
  ('7f5ce8f0-c785-48ae-8ce9-f702cf75584c', 'apex-solutions', '2025-06-01', 137200, 'manual_entry'),
  ('7f5ce8f0-c785-48ae-8ce9-f702cf75584c', 'apex-solutions', '2025-07-01', 139800, 'manual_entry')
ON CONFLICT DO NOTHING;

-- Profit Margin
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  ('e0b619d0-2717-407e-a121-d347503d6568', 'apex-solutions', '2024-08-01', 38.2, 'manual_entry'),
  ('e0b619d0-2717-407e-a121-d347503d6568', 'apex-solutions', '2024-09-01', 38.8, 'manual_entry'),
  ('e0b619d0-2717-407e-a121-d347503d6568', 'apex-solutions', '2024-10-01', 39.5, 'manual_entry'),
  ('e0b619d0-2717-407e-a121-d347503d6568', 'apex-solutions', '2024-11-01', 39.1, 'manual_entry'),
  ('e0b619d0-2717-407e-a121-d347503d6568', 'apex-solutions', '2024-12-01', 40.2, 'manual_entry'),
  ('e0b619d0-2717-407e-a121-d347503d6568', 'apex-solutions', '2025-01-01', 41.0, 'manual_entry'),
  ('e0b619d0-2717-407e-a121-d347503d6568', 'apex-solutions', '2025-02-01', 41.8, 'manual_entry'),
  ('e0b619d0-2717-407e-a121-d347503d6568', 'apex-solutions', '2025-03-01', 42.5, 'manual_entry'),
  ('e0b619d0-2717-407e-a121-d347503d6568', 'apex-solutions', '2025-04-01', 43.2, 'manual_entry'),
  ('e0b619d0-2717-407e-a121-d347503d6568', 'apex-solutions', '2025-05-01', 44.1, 'manual_entry'),
  ('e0b619d0-2717-407e-a121-d347503d6568', 'apex-solutions', '2025-06-01', 45.0, 'manual_entry'),
  ('e0b619d0-2717-407e-a121-d347503d6568', 'apex-solutions', '2025-07-01', 45.8, 'manual_entry')
ON CONFLICT DO NOTHING;

-- Revenue Per Client
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  ('6c30d2d6-5cd3-41ed-9704-b0d235a6b32b', 'apex-solutions', '2024-08-01', 452, 'manual_entry'),
  ('6c30d2d6-5cd3-41ed-9704-b0d235a6b32b', 'apex-solutions', '2024-09-01', 458, 'manual_entry'),
  ('6c30d2d6-5cd3-41ed-9704-b0d235a6b32b', 'apex-solutions', '2024-10-01', 465, 'manual_entry'),
  ('6c30d2d6-5cd3-41ed-9704-b0d235a6b32b', 'apex-solutions', '2024-11-01', 471, 'manual_entry'),
  ('6c30d2d6-5cd3-41ed-9704-b0d235a6b32b', 'apex-solutions', '2024-12-01', 478, 'manual_entry'),
  ('6c30d2d6-5cd3-41ed-9704-b0d235a6b32b', 'apex-solutions', '2025-01-01', 485, 'manual_entry'),
  ('6c30d2d6-5cd3-41ed-9704-b0d235a6b32b', 'apex-solutions', '2025-02-01', 490, 'manual_entry'),
  ('6c30d2d6-5cd3-41ed-9704-b0d235a6b32b', 'apex-solutions', '2025-03-01', 497, 'manual_entry'),
  ('6c30d2d6-5cd3-41ed-9704-b0d235a6b32b', 'apex-solutions', '2025-04-01', 503, 'manual_entry'),
  ('6c30d2d6-5cd3-41ed-9704-b0d235a6b32b', 'apex-solutions', '2025-05-01', 508, 'manual_entry'),
  ('6c30d2d6-5cd3-41ed-9704-b0d235a6b32b', 'apex-solutions', '2025-06-01', 514, 'manual_entry'),
  ('6c30d2d6-5cd3-41ed-9704-b0d235a6b32b', 'apex-solutions', '2025-07-01', 521, 'manual_entry')
ON CONFLICT DO NOTHING;

-- Cost Per Acquisition
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  ('2f8b6f46-a7e5-4762-a857-472adac42a7b', 'apex-solutions', '2024-08-01', 852, 'manual_entry'),
  ('2f8b6f46-a7e5-4762-a857-472adac42a7b', 'apex-solutions', '2024-09-01', 838, 'manual_entry'),
  ('2f8b6f46-a7e5-4762-a857-472adac42a7b', 'apex-solutions', '2024-10-01', 825, 'manual_entry'),
  ('2f8b6f46-a7e5-4762-a857-472adac42a7b', 'apex-solutions', '2024-11-01', 818, 'manual_entry'),
  ('2f8b6f46-a7e5-4762-a857-472adac42a7b', 'apex-solutions', '2024-12-01', 805, 'manual_entry'),
  ('2f8b6f46-a7e5-4762-a857-472adac42a7b', 'apex-solutions', '2025-01-01', 790, 'manual_entry'),
  ('2f8b6f46-a7e5-4762-a857-472adac42a7b', 'apex-solutions', '2025-02-01', 778, 'manual_entry'),
  ('2f8b6f46-a7e5-4762-a857-472adac42a7b', 'apex-solutions', '2025-03-01', 765, 'manual_entry'),
  ('2f8b6f46-a7e5-4762-a857-472adac42a7b', 'apex-solutions', '2025-04-01', 752, 'manual_entry'),
  ('2f8b6f46-a7e5-4762-a857-472adac42a7b', 'apex-solutions', '2025-05-01', 740, 'manual_entry'),
  ('2f8b6f46-a7e5-4762-a857-472adac42a7b', 'apex-solutions', '2025-06-01', 728, 'manual_entry'),
  ('2f8b6f46-a7e5-4762-a857-472adac42a7b', 'apex-solutions', '2025-07-01', 718, 'manual_entry')
ON CONFLICT DO NOTHING;

-- Patient Satisfaction Score
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  ('25974964-28f2-4b40-86fc-2aaa318699a3', 'apex-solutions', '2024-08-01', 88.1, 'manual_entry'),
  ('25974964-28f2-4b40-86fc-2aaa318699a3', 'apex-solutions', '2024-09-01', 88.5, 'manual_entry'),
  ('25974964-28f2-4b40-86fc-2aaa318699a3', 'apex-solutions', '2024-10-01', 89.2, 'manual_entry'),
  ('25974964-28f2-4b40-86fc-2aaa318699a3', 'apex-solutions', '2024-11-01', 89.8, 'manual_entry'),
  ('25974964-28f2-4b40-86fc-2aaa318699a3', 'apex-solutions', '2024-12-01', 90.3, 'manual_entry'),
  ('25974964-28f2-4b40-86fc-2aaa318699a3', 'apex-solutions', '2025-01-01', 90.8, 'manual_entry'),
  ('25974964-28f2-4b40-86fc-2aaa318699a3', 'apex-solutions', '2025-02-01', 91.4, 'manual_entry'),
  ('25974964-28f2-4b40-86fc-2aaa318699a3', 'apex-solutions', '2025-03-01', 91.9, 'manual_entry'),
  ('25974964-28f2-4b40-86fc-2aaa318699a3', 'apex-solutions', '2025-04-01', 92.5, 'manual_entry'),
  ('25974964-28f2-4b40-86fc-2aaa318699a3', 'apex-solutions', '2025-05-01', 93.0, 'manual_entry'),
  ('25974964-28f2-4b40-86fc-2aaa318699a3', 'apex-solutions', '2025-06-01', 93.5, 'manual_entry'),
  ('25974964-28f2-4b40-86fc-2aaa318699a3', 'apex-solutions', '2025-07-01', 94.1, 'manual_entry')
ON CONFLICT DO NOTHING;

-- Readmission Rate (declining = good)
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  ('425310da-42d8-432c-84bd-2f8f543516ce', 'apex-solutions', '2024-08-01', 7.8, 'manual_entry'),
  ('425310da-42d8-432c-84bd-2f8f543516ce', 'apex-solutions', '2024-09-01', 7.5, 'manual_entry'),
  ('425310da-42d8-432c-84bd-2f8f543516ce', 'apex-solutions', '2024-10-01', 7.2, 'manual_entry'),
  ('425310da-42d8-432c-84bd-2f8f543516ce', 'apex-solutions', '2024-11-01', 7.0, 'manual_entry'),
  ('425310da-42d8-432c-84bd-2f8f543516ce', 'apex-solutions', '2024-12-01', 6.8, 'manual_entry'),
  ('425310da-42d8-432c-84bd-2f8f543516ce', 'apex-solutions', '2025-01-01', 6.5, 'manual_entry'),
  ('425310da-42d8-432c-84bd-2f8f543516ce', 'apex-solutions', '2025-02-01', 6.2, 'manual_entry'),
  ('425310da-42d8-432c-84bd-2f8f543516ce', 'apex-solutions', '2025-03-01', 6.0, 'manual_entry'),
  ('425310da-42d8-432c-84bd-2f8f543516ce', 'apex-solutions', '2025-04-01', 5.7, 'manual_entry'),
  ('425310da-42d8-432c-84bd-2f8f543516ce', 'apex-solutions', '2025-05-01', 5.5, 'manual_entry'),
  ('425310da-42d8-432c-84bd-2f8f543516ce', 'apex-solutions', '2025-06-01', 5.2, 'manual_entry'),
  ('425310da-42d8-432c-84bd-2f8f543516ce', 'apex-solutions', '2025-07-01', 5.0, 'manual_entry')
ON CONFLICT DO NOTHING;

-- Goal Achievement Rate
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  ('065dce37-016b-4211-8103-cc6271846cd9', 'apex-solutions', '2024-08-01', 82.3, 'manual_entry'),
  ('065dce37-016b-4211-8103-cc6271846cd9', 'apex-solutions', '2024-09-01', 83.1, 'manual_entry'),
  ('065dce37-016b-4211-8103-cc6271846cd9', 'apex-solutions', '2024-10-01', 84.0, 'manual_entry'),
  ('065dce37-016b-4211-8103-cc6271846cd9', 'apex-solutions', '2024-11-01', 84.5, 'manual_entry'),
  ('065dce37-016b-4211-8103-cc6271846cd9', 'apex-solutions', '2024-12-01', 85.2, 'manual_entry'),
  ('065dce37-016b-4211-8103-cc6271846cd9', 'apex-solutions', '2025-01-01', 86.0, 'manual_entry'),
  ('065dce37-016b-4211-8103-cc6271846cd9', 'apex-solutions', '2025-02-01', 86.8, 'manual_entry'),
  ('065dce37-016b-4211-8103-cc6271846cd9', 'apex-solutions', '2025-03-01', 87.5, 'manual_entry'),
  ('065dce37-016b-4211-8103-cc6271846cd9', 'apex-solutions', '2025-04-01', 88.2, 'manual_entry'),
  ('065dce37-016b-4211-8103-cc6271846cd9', 'apex-solutions', '2025-05-01', 89.0, 'manual_entry'),
  ('065dce37-016b-4211-8103-cc6271846cd9', 'apex-solutions', '2025-06-01', 90.1, 'manual_entry'),
  ('065dce37-016b-4211-8103-cc6271846cd9', 'apex-solutions', '2025-07-01', 91.2, 'manual_entry')
ON CONFLICT DO NOTHING;

-- Net Promoter Score
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  ('326537e5-e89a-4606-829a-1e2090c6123e', 'apex-solutions', '2024-08-01', 72, 'manual_entry'),
  ('326537e5-e89a-4606-829a-1e2090c6123e', 'apex-solutions', '2024-09-01', 73, 'manual_entry'),
  ('326537e5-e89a-4606-829a-1e2090c6123e', 'apex-solutions', '2024-10-01', 74, 'manual_entry'),
  ('326537e5-e89a-4606-829a-1e2090c6123e', 'apex-solutions', '2024-11-01', 73, 'manual_entry'),
  ('326537e5-e89a-4606-829a-1e2090c6123e', 'apex-solutions', '2024-12-01', 75, 'manual_entry'),
  ('326537e5-e89a-4606-829a-1e2090c6123e', 'apex-solutions', '2025-01-01', 76, 'manual_entry'),
  ('326537e5-e89a-4606-829a-1e2090c6123e', 'apex-solutions', '2025-02-01', 77, 'manual_entry'),
  ('326537e5-e89a-4606-829a-1e2090c6123e', 'apex-solutions', '2025-03-01', 78, 'manual_entry'),
  ('326537e5-e89a-4606-829a-1e2090c6123e', 'apex-solutions', '2025-04-01', 79, 'manual_entry'),
  ('326537e5-e89a-4606-829a-1e2090c6123e', 'apex-solutions', '2025-05-01', 80, 'manual_entry'),
  ('326537e5-e89a-4606-829a-1e2090c6123e', 'apex-solutions', '2025-06-01', 81, 'manual_entry'),
  ('326537e5-e89a-4606-829a-1e2090c6123e', 'apex-solutions', '2025-07-01', 82, 'manual_entry')
ON CONFLICT DO NOTHING;

-- Avg Response Time (declining = good)
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  ('14ca5c84-5b19-49ea-b8a4-7a4d006521c4', 'apex-solutions', '2024-08-01', 4.2, 'manual_entry'),
  ('14ca5c84-5b19-49ea-b8a4-7a4d006521c4', 'apex-solutions', '2024-09-01', 4.0, 'manual_entry'),
  ('14ca5c84-5b19-49ea-b8a4-7a4d006521c4', 'apex-solutions', '2024-10-01', 3.8, 'manual_entry'),
  ('14ca5c84-5b19-49ea-b8a4-7a4d006521c4', 'apex-solutions', '2024-11-01', 3.6, 'manual_entry'),
  ('14ca5c84-5b19-49ea-b8a4-7a4d006521c4', 'apex-solutions', '2024-12-01', 3.4, 'manual_entry'),
  ('14ca5c84-5b19-49ea-b8a4-7a4d006521c4', 'apex-solutions', '2025-01-01', 3.2, 'manual_entry'),
  ('14ca5c84-5b19-49ea-b8a4-7a4d006521c4', 'apex-solutions', '2025-02-01', 3.0, 'manual_entry'),
  ('14ca5c84-5b19-49ea-b8a4-7a4d006521c4', 'apex-solutions', '2025-03-01', 2.8, 'manual_entry'),
  ('14ca5c84-5b19-49ea-b8a4-7a4d006521c4', 'apex-solutions', '2025-04-01', 2.6, 'manual_entry'),
  ('14ca5c84-5b19-49ea-b8a4-7a4d006521c4', 'apex-solutions', '2025-05-01', 2.4, 'manual_entry'),
  ('14ca5c84-5b19-49ea-b8a4-7a4d006521c4', 'apex-solutions', '2025-06-01', 2.2, 'manual_entry'),
  ('14ca5c84-5b19-49ea-b8a4-7a4d006521c4', 'apex-solutions', '2025-07-01', 2.1, 'manual_entry')
ON CONFLICT DO NOTHING;

-- Support Ticket Volume (declining = good for mature org)
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  ('4389c2f3-54f3-480d-9b64-094ede239102', 'apex-solutions', '2024-08-01', 145, 'manual_entry'),
  ('4389c2f3-54f3-480d-9b64-094ede239102', 'apex-solutions', '2024-09-01', 138, 'manual_entry'),
  ('4389c2f3-54f3-480d-9b64-094ede239102', 'apex-solutions', '2024-10-01', 132, 'manual_entry'),
  ('4389c2f3-54f3-480d-9b64-094ede239102', 'apex-solutions', '2024-11-01', 128, 'manual_entry'),
  ('4389c2f3-54f3-480d-9b64-094ede239102', 'apex-solutions', '2024-12-01', 122, 'manual_entry'),
  ('4389c2f3-54f3-480d-9b64-094ede239102', 'apex-solutions', '2025-01-01', 118, 'manual_entry'),
  ('4389c2f3-54f3-480d-9b64-094ede239102', 'apex-solutions', '2025-02-01', 115, 'manual_entry'),
  ('4389c2f3-54f3-480d-9b64-094ede239102', 'apex-solutions', '2025-03-01', 110, 'manual_entry'),
  ('4389c2f3-54f3-480d-9b64-094ede239102', 'apex-solutions', '2025-04-01', 108, 'manual_entry'),
  ('4389c2f3-54f3-480d-9b64-094ede239102', 'apex-solutions', '2025-05-01', 104, 'manual_entry'),
  ('4389c2f3-54f3-480d-9b64-094ede239102', 'apex-solutions', '2025-06-01', 100, 'manual_entry'),
  ('4389c2f3-54f3-480d-9b64-094ede239102', 'apex-solutions', '2025-07-01', 98, 'manual_entry')
ON CONFLICT DO NOTHING;

-- Staff Utilization
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  ('39215f6e-80e3-4553-97b1-ae468fcda469', 'apex-solutions', '2024-08-01', 78.2, 'manual_entry'),
  ('39215f6e-80e3-4553-97b1-ae468fcda469', 'apex-solutions', '2024-09-01', 79.1, 'manual_entry'),
  ('39215f6e-80e3-4553-97b1-ae468fcda469', 'apex-solutions', '2024-10-01', 80.0, 'manual_entry'),
  ('39215f6e-80e3-4553-97b1-ae468fcda469', 'apex-solutions', '2024-11-01', 80.8, 'manual_entry'),
  ('39215f6e-80e3-4553-97b1-ae468fcda469', 'apex-solutions', '2024-12-01', 81.5, 'manual_entry'),
  ('39215f6e-80e3-4553-97b1-ae468fcda469', 'apex-solutions', '2025-01-01', 82.3, 'manual_entry'),
  ('39215f6e-80e3-4553-97b1-ae468fcda469', 'apex-solutions', '2025-02-01', 83.0, 'manual_entry'),
  ('39215f6e-80e3-4553-97b1-ae468fcda469', 'apex-solutions', '2025-03-01', 84.1, 'manual_entry'),
  ('39215f6e-80e3-4553-97b1-ae468fcda469', 'apex-solutions', '2025-04-01', 85.0, 'manual_entry'),
  ('39215f6e-80e3-4553-97b1-ae468fcda469', 'apex-solutions', '2025-05-01', 86.2, 'manual_entry'),
  ('39215f6e-80e3-4553-97b1-ae468fcda469', 'apex-solutions', '2025-06-01', 87.0, 'manual_entry'),
  ('39215f6e-80e3-4553-97b1-ae468fcda469', 'apex-solutions', '2025-07-01', 88.1, 'manual_entry')
ON CONFLICT DO NOTHING;

-- Avg Session Duration
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  ('57aa989f-50da-4500-ac9d-0b48a402300b', 'apex-solutions', '2024-08-01', 42.5, 'manual_entry'),
  ('57aa989f-50da-4500-ac9d-0b48a402300b', 'apex-solutions', '2024-09-01', 43.0, 'manual_entry'),
  ('57aa989f-50da-4500-ac9d-0b48a402300b', 'apex-solutions', '2024-10-01', 43.5, 'manual_entry'),
  ('57aa989f-50da-4500-ac9d-0b48a402300b', 'apex-solutions', '2024-11-01', 44.0, 'manual_entry'),
  ('57aa989f-50da-4500-ac9d-0b48a402300b', 'apex-solutions', '2024-12-01', 44.2, 'manual_entry'),
  ('57aa989f-50da-4500-ac9d-0b48a402300b', 'apex-solutions', '2025-01-01', 44.8, 'manual_entry'),
  ('57aa989f-50da-4500-ac9d-0b48a402300b', 'apex-solutions', '2025-02-01', 45.2, 'manual_entry'),
  ('57aa989f-50da-4500-ac9d-0b48a402300b', 'apex-solutions', '2025-03-01', 45.8, 'manual_entry'),
  ('57aa989f-50da-4500-ac9d-0b48a402300b', 'apex-solutions', '2025-04-01', 46.3, 'manual_entry'),
  ('57aa989f-50da-4500-ac9d-0b48a402300b', 'apex-solutions', '2025-05-01', 46.8, 'manual_entry'),
  ('57aa989f-50da-4500-ac9d-0b48a402300b', 'apex-solutions', '2025-06-01', 47.2, 'manual_entry'),
  ('57aa989f-50da-4500-ac9d-0b48a402300b', 'apex-solutions', '2025-07-01', 47.8, 'manual_entry')
ON CONFLICT DO NOTHING;

-- Referral Rate
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  ('abf27910-1597-44c8-a660-d237d71f129c', 'apex-solutions', '2024-08-01', 22.1, 'manual_entry'),
  ('abf27910-1597-44c8-a660-d237d71f129c', 'apex-solutions', '2024-09-01', 23.0, 'manual_entry'),
  ('abf27910-1597-44c8-a660-d237d71f129c', 'apex-solutions', '2024-10-01', 24.2, 'manual_entry'),
  ('abf27910-1597-44c8-a660-d237d71f129c', 'apex-solutions', '2024-11-01', 24.8, 'manual_entry'),
  ('abf27910-1597-44c8-a660-d237d71f129c', 'apex-solutions', '2024-12-01', 25.5, 'manual_entry'),
  ('abf27910-1597-44c8-a660-d237d71f129c', 'apex-solutions', '2025-01-01', 26.3, 'manual_entry'),
  ('abf27910-1597-44c8-a660-d237d71f129c', 'apex-solutions', '2025-02-01', 27.1, 'manual_entry'),
  ('abf27910-1597-44c8-a660-d237d71f129c', 'apex-solutions', '2025-03-01', 28.0, 'manual_entry'),
  ('abf27910-1597-44c8-a660-d237d71f129c', 'apex-solutions', '2025-04-01', 29.2, 'manual_entry'),
  ('abf27910-1597-44c8-a660-d237d71f129c', 'apex-solutions', '2025-05-01', 30.1, 'manual_entry'),
  ('abf27910-1597-44c8-a660-d237d71f129c', 'apex-solutions', '2025-06-01', 31.0, 'manual_entry'),
  ('abf27910-1597-44c8-a660-d237d71f129c', 'apex-solutions', '2025-07-01', 32.2, 'manual_entry')
ON CONFLICT DO NOTHING;

-- New Client Pipeline
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  ('65c955e0-363c-47a7-8ddf-68b0b8e977e2', 'apex-solutions', '2024-08-01', 34, 'manual_entry'),
  ('65c955e0-363c-47a7-8ddf-68b0b8e977e2', 'apex-solutions', '2024-09-01', 36, 'manual_entry'),
  ('65c955e0-363c-47a7-8ddf-68b0b8e977e2', 'apex-solutions', '2024-10-01', 38, 'manual_entry'),
  ('65c955e0-363c-47a7-8ddf-68b0b8e977e2', 'apex-solutions', '2024-11-01', 37, 'manual_entry'),
  ('65c955e0-363c-47a7-8ddf-68b0b8e977e2', 'apex-solutions', '2024-12-01', 40, 'manual_entry'),
  ('65c955e0-363c-47a7-8ddf-68b0b8e977e2', 'apex-solutions', '2025-01-01', 42, 'manual_entry'),
  ('65c955e0-363c-47a7-8ddf-68b0b8e977e2', 'apex-solutions', '2025-02-01', 43, 'manual_entry'),
  ('65c955e0-363c-47a7-8ddf-68b0b8e977e2', 'apex-solutions', '2025-03-01', 45, 'manual_entry'),
  ('65c955e0-363c-47a7-8ddf-68b0b8e977e2', 'apex-solutions', '2025-04-01', 47, 'manual_entry'),
  ('65c955e0-363c-47a7-8ddf-68b0b8e977e2', 'apex-solutions', '2025-05-01', 48, 'manual_entry'),
  ('65c955e0-363c-47a7-8ddf-68b0b8e977e2', 'apex-solutions', '2025-06-01', 50, 'manual_entry'),
  ('65c955e0-363c-47a7-8ddf-68b0b8e977e2', 'apex-solutions', '2025-07-01', 52, 'manual_entry')
ON CONFLICT DO NOTHING;
