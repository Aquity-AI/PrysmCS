/*
  # Seed Realistic Historical Data for Cascade Enterprises

  Cascade Enterprises is a mid-tier, steady client with moderate growth.
  Data covers Aug 2024 - Jul 2025 (12 months).

  Profile:
  - Revenue growing from ~$120K to ~$148K
  - Profit margins from 32% to 38%
  - Patient satisfaction from 80% to 87%
  - NPS from 58 to 68
  - Readmission rates improving from 11% to 8%
*/

-- Fill missing months for Service Volume (has Aug 2024 - Jan 2025)
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  ('23fe89ca-525d-4f3c-a708-343e0d2ca979', 'cascade-enterprises', '2025-02-01', 645, 'manual_entry'),
  ('23fe89ca-525d-4f3c-a708-343e0d2ca979', 'cascade-enterprises', '2025-03-01', 658, 'manual_entry'),
  ('23fe89ca-525d-4f3c-a708-343e0d2ca979', 'cascade-enterprises', '2025-04-01', 670, 'manual_entry'),
  ('23fe89ca-525d-4f3c-a708-343e0d2ca979', 'cascade-enterprises', '2025-05-01', 685, 'manual_entry'),
  ('23fe89ca-525d-4f3c-a708-343e0d2ca979', 'cascade-enterprises', '2025-06-01', 698, 'manual_entry'),
  ('23fe89ca-525d-4f3c-a708-343e0d2ca979', 'cascade-enterprises', '2025-07-01', 712, 'manual_entry')
ON CONFLICT DO NOTHING;

-- Fill missing months for Monthly Revenue (has Aug 2024 - Jan 2025)
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  ('1eb84687-0ce1-4d8b-bd59-526f88ce40ab', 'cascade-enterprises', '2025-02-01', 130200, 'manual_entry'),
  ('1eb84687-0ce1-4d8b-bd59-526f88ce40ab', 'cascade-enterprises', '2025-03-01', 133500, 'manual_entry'),
  ('1eb84687-0ce1-4d8b-bd59-526f88ce40ab', 'cascade-enterprises', '2025-04-01', 136800, 'manual_entry'),
  ('1eb84687-0ce1-4d8b-bd59-526f88ce40ab', 'cascade-enterprises', '2025-05-01', 140100, 'manual_entry'),
  ('1eb84687-0ce1-4d8b-bd59-526f88ce40ab', 'cascade-enterprises', '2025-06-01', 143500, 'manual_entry'),
  ('1eb84687-0ce1-4d8b-bd59-526f88ce40ab', 'cascade-enterprises', '2025-07-01', 147800, 'manual_entry')
ON CONFLICT DO NOTHING;

-- Enrollment Growth Rate: full 12 months
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  ('37fd266d-c392-4eb6-bed6-8a4af1b8370b', 'cascade-enterprises', '2024-08-01', 3.1, 'manual_entry'),
  ('37fd266d-c392-4eb6-bed6-8a4af1b8370b', 'cascade-enterprises', '2024-09-01', 3.4, 'manual_entry'),
  ('37fd266d-c392-4eb6-bed6-8a4af1b8370b', 'cascade-enterprises', '2024-10-01', 3.6, 'manual_entry'),
  ('37fd266d-c392-4eb6-bed6-8a4af1b8370b', 'cascade-enterprises', '2024-11-01', 3.3, 'manual_entry'),
  ('37fd266d-c392-4eb6-bed6-8a4af1b8370b', 'cascade-enterprises', '2024-12-01', 3.8, 'manual_entry'),
  ('37fd266d-c392-4eb6-bed6-8a4af1b8370b', 'cascade-enterprises', '2025-01-01', 4.1, 'manual_entry'),
  ('37fd266d-c392-4eb6-bed6-8a4af1b8370b', 'cascade-enterprises', '2025-02-01', 4.4, 'manual_entry'),
  ('37fd266d-c392-4eb6-bed6-8a4af1b8370b', 'cascade-enterprises', '2025-03-01', 4.6, 'manual_entry'),
  ('37fd266d-c392-4eb6-bed6-8a4af1b8370b', 'cascade-enterprises', '2025-04-01', 4.9, 'manual_entry'),
  ('37fd266d-c392-4eb6-bed6-8a4af1b8370b', 'cascade-enterprises', '2025-05-01', 5.2, 'manual_entry'),
  ('37fd266d-c392-4eb6-bed6-8a4af1b8370b', 'cascade-enterprises', '2025-06-01', 5.5, 'manual_entry'),
  ('37fd266d-c392-4eb6-bed6-8a4af1b8370b', 'cascade-enterprises', '2025-07-01', 5.8, 'manual_entry')
ON CONFLICT DO NOTHING;

-- Patient Retention Rate
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  ('34469e7d-1bc4-4b54-8cb6-3b3bcd107c6f', 'cascade-enterprises', '2024-08-01', 84.0, 'manual_entry'),
  ('34469e7d-1bc4-4b54-8cb6-3b3bcd107c6f', 'cascade-enterprises', '2024-09-01', 84.3, 'manual_entry'),
  ('34469e7d-1bc4-4b54-8cb6-3b3bcd107c6f', 'cascade-enterprises', '2024-10-01', 84.8, 'manual_entry'),
  ('34469e7d-1bc4-4b54-8cb6-3b3bcd107c6f', 'cascade-enterprises', '2024-11-01', 85.2, 'manual_entry'),
  ('34469e7d-1bc4-4b54-8cb6-3b3bcd107c6f', 'cascade-enterprises', '2024-12-01', 85.5, 'manual_entry'),
  ('34469e7d-1bc4-4b54-8cb6-3b3bcd107c6f', 'cascade-enterprises', '2025-01-01', 86.0, 'manual_entry'),
  ('34469e7d-1bc4-4b54-8cb6-3b3bcd107c6f', 'cascade-enterprises', '2025-02-01', 86.4, 'manual_entry'),
  ('34469e7d-1bc4-4b54-8cb6-3b3bcd107c6f', 'cascade-enterprises', '2025-03-01', 86.8, 'manual_entry'),
  ('34469e7d-1bc4-4b54-8cb6-3b3bcd107c6f', 'cascade-enterprises', '2025-04-01', 87.2, 'manual_entry'),
  ('34469e7d-1bc4-4b54-8cb6-3b3bcd107c6f', 'cascade-enterprises', '2025-05-01', 87.8, 'manual_entry'),
  ('34469e7d-1bc4-4b54-8cb6-3b3bcd107c6f', 'cascade-enterprises', '2025-06-01', 88.2, 'manual_entry'),
  ('34469e7d-1bc4-4b54-8cb6-3b3bcd107c6f', 'cascade-enterprises', '2025-07-01', 88.8, 'manual_entry')
ON CONFLICT DO NOTHING;

-- Operating Costs
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  ('52f919d8-9493-498a-be77-4fef5cc03e3b', 'cascade-enterprises', '2024-08-01', 85200, 'manual_entry'),
  ('52f919d8-9493-498a-be77-4fef5cc03e3b', 'cascade-enterprises', '2024-09-01', 86100, 'manual_entry'),
  ('52f919d8-9493-498a-be77-4fef5cc03e3b', 'cascade-enterprises', '2024-10-01', 87300, 'manual_entry'),
  ('52f919d8-9493-498a-be77-4fef5cc03e3b', 'cascade-enterprises', '2024-11-01', 88500, 'manual_entry'),
  ('52f919d8-9493-498a-be77-4fef5cc03e3b', 'cascade-enterprises', '2024-12-01', 89800, 'manual_entry'),
  ('52f919d8-9493-498a-be77-4fef5cc03e3b', 'cascade-enterprises', '2025-01-01', 90500, 'manual_entry'),
  ('52f919d8-9493-498a-be77-4fef5cc03e3b', 'cascade-enterprises', '2025-02-01', 91800, 'manual_entry'),
  ('52f919d8-9493-498a-be77-4fef5cc03e3b', 'cascade-enterprises', '2025-03-01', 92600, 'manual_entry'),
  ('52f919d8-9493-498a-be77-4fef5cc03e3b', 'cascade-enterprises', '2025-04-01', 93800, 'manual_entry'),
  ('52f919d8-9493-498a-be77-4fef5cc03e3b', 'cascade-enterprises', '2025-05-01', 95200, 'manual_entry'),
  ('52f919d8-9493-498a-be77-4fef5cc03e3b', 'cascade-enterprises', '2025-06-01', 96500, 'manual_entry'),
  ('52f919d8-9493-498a-be77-4fef5cc03e3b', 'cascade-enterprises', '2025-07-01', 97800, 'manual_entry')
ON CONFLICT DO NOTHING;

-- Profit Margin
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  ('35c09368-1401-4bf2-b704-285d9d9b4d79', 'cascade-enterprises', '2024-08-01', 32.0, 'manual_entry'),
  ('35c09368-1401-4bf2-b704-285d9d9b4d79', 'cascade-enterprises', '2024-09-01', 32.5, 'manual_entry'),
  ('35c09368-1401-4bf2-b704-285d9d9b4d79', 'cascade-enterprises', '2024-10-01', 33.0, 'manual_entry'),
  ('35c09368-1401-4bf2-b704-285d9d9b4d79', 'cascade-enterprises', '2024-11-01', 32.8, 'manual_entry'),
  ('35c09368-1401-4bf2-b704-285d9d9b4d79', 'cascade-enterprises', '2024-12-01', 33.5, 'manual_entry'),
  ('35c09368-1401-4bf2-b704-285d9d9b4d79', 'cascade-enterprises', '2025-01-01', 34.0, 'manual_entry'),
  ('35c09368-1401-4bf2-b704-285d9d9b4d79', 'cascade-enterprises', '2025-02-01', 34.8, 'manual_entry'),
  ('35c09368-1401-4bf2-b704-285d9d9b4d79', 'cascade-enterprises', '2025-03-01', 35.2, 'manual_entry'),
  ('35c09368-1401-4bf2-b704-285d9d9b4d79', 'cascade-enterprises', '2025-04-01', 35.8, 'manual_entry'),
  ('35c09368-1401-4bf2-b704-285d9d9b4d79', 'cascade-enterprises', '2025-05-01', 36.5, 'manual_entry'),
  ('35c09368-1401-4bf2-b704-285d9d9b4d79', 'cascade-enterprises', '2025-06-01', 37.2, 'manual_entry'),
  ('35c09368-1401-4bf2-b704-285d9d9b4d79', 'cascade-enterprises', '2025-07-01', 37.8, 'manual_entry')
ON CONFLICT DO NOTHING;

-- Revenue Per Client
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  ('b3c0d4a9-d7b7-45b9-b267-740ab239c184', 'cascade-enterprises', '2024-08-01', 382, 'manual_entry'),
  ('b3c0d4a9-d7b7-45b9-b267-740ab239c184', 'cascade-enterprises', '2024-09-01', 386, 'manual_entry'),
  ('b3c0d4a9-d7b7-45b9-b267-740ab239c184', 'cascade-enterprises', '2024-10-01', 390, 'manual_entry'),
  ('b3c0d4a9-d7b7-45b9-b267-740ab239c184', 'cascade-enterprises', '2024-11-01', 394, 'manual_entry'),
  ('b3c0d4a9-d7b7-45b9-b267-740ab239c184', 'cascade-enterprises', '2024-12-01', 398, 'manual_entry'),
  ('b3c0d4a9-d7b7-45b9-b267-740ab239c184', 'cascade-enterprises', '2025-01-01', 401, 'manual_entry'),
  ('b3c0d4a9-d7b7-45b9-b267-740ab239c184', 'cascade-enterprises', '2025-02-01', 405, 'manual_entry'),
  ('b3c0d4a9-d7b7-45b9-b267-740ab239c184', 'cascade-enterprises', '2025-03-01', 408, 'manual_entry'),
  ('b3c0d4a9-d7b7-45b9-b267-740ab239c184', 'cascade-enterprises', '2025-04-01', 412, 'manual_entry'),
  ('b3c0d4a9-d7b7-45b9-b267-740ab239c184', 'cascade-enterprises', '2025-05-01', 415, 'manual_entry'),
  ('b3c0d4a9-d7b7-45b9-b267-740ab239c184', 'cascade-enterprises', '2025-06-01', 418, 'manual_entry'),
  ('b3c0d4a9-d7b7-45b9-b267-740ab239c184', 'cascade-enterprises', '2025-07-01', 422, 'manual_entry')
ON CONFLICT DO NOTHING;

-- Cost Per Acquisition
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  ('7e8db553-583a-4a23-b4c6-524f5519dc37', 'cascade-enterprises', '2024-08-01', 920, 'manual_entry'),
  ('7e8db553-583a-4a23-b4c6-524f5519dc37', 'cascade-enterprises', '2024-09-01', 910, 'manual_entry'),
  ('7e8db553-583a-4a23-b4c6-524f5519dc37', 'cascade-enterprises', '2024-10-01', 900, 'manual_entry'),
  ('7e8db553-583a-4a23-b4c6-524f5519dc37', 'cascade-enterprises', '2024-11-01', 895, 'manual_entry'),
  ('7e8db553-583a-4a23-b4c6-524f5519dc37', 'cascade-enterprises', '2024-12-01', 885, 'manual_entry'),
  ('7e8db553-583a-4a23-b4c6-524f5519dc37', 'cascade-enterprises', '2025-01-01', 878, 'manual_entry'),
  ('7e8db553-583a-4a23-b4c6-524f5519dc37', 'cascade-enterprises', '2025-02-01', 870, 'manual_entry'),
  ('7e8db553-583a-4a23-b4c6-524f5519dc37', 'cascade-enterprises', '2025-03-01', 862, 'manual_entry'),
  ('7e8db553-583a-4a23-b4c6-524f5519dc37', 'cascade-enterprises', '2025-04-01', 855, 'manual_entry'),
  ('7e8db553-583a-4a23-b4c6-524f5519dc37', 'cascade-enterprises', '2025-05-01', 848, 'manual_entry'),
  ('7e8db553-583a-4a23-b4c6-524f5519dc37', 'cascade-enterprises', '2025-06-01', 842, 'manual_entry'),
  ('7e8db553-583a-4a23-b4c6-524f5519dc37', 'cascade-enterprises', '2025-07-01', 838, 'manual_entry')
ON CONFLICT DO NOTHING;

-- Patient Satisfaction Score
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  ('16c0d4c8-3995-4ac7-b448-b674e63dce5c', 'cascade-enterprises', '2024-08-01', 80.2, 'manual_entry'),
  ('16c0d4c8-3995-4ac7-b448-b674e63dce5c', 'cascade-enterprises', '2024-09-01', 80.8, 'manual_entry'),
  ('16c0d4c8-3995-4ac7-b448-b674e63dce5c', 'cascade-enterprises', '2024-10-01', 81.5, 'manual_entry'),
  ('16c0d4c8-3995-4ac7-b448-b674e63dce5c', 'cascade-enterprises', '2024-11-01', 82.0, 'manual_entry'),
  ('16c0d4c8-3995-4ac7-b448-b674e63dce5c', 'cascade-enterprises', '2024-12-01', 82.8, 'manual_entry'),
  ('16c0d4c8-3995-4ac7-b448-b674e63dce5c', 'cascade-enterprises', '2025-01-01', 83.2, 'manual_entry'),
  ('16c0d4c8-3995-4ac7-b448-b674e63dce5c', 'cascade-enterprises', '2025-02-01', 83.8, 'manual_entry'),
  ('16c0d4c8-3995-4ac7-b448-b674e63dce5c', 'cascade-enterprises', '2025-03-01', 84.5, 'manual_entry'),
  ('16c0d4c8-3995-4ac7-b448-b674e63dce5c', 'cascade-enterprises', '2025-04-01', 85.0, 'manual_entry'),
  ('16c0d4c8-3995-4ac7-b448-b674e63dce5c', 'cascade-enterprises', '2025-05-01', 85.8, 'manual_entry'),
  ('16c0d4c8-3995-4ac7-b448-b674e63dce5c', 'cascade-enterprises', '2025-06-01', 86.2, 'manual_entry'),
  ('16c0d4c8-3995-4ac7-b448-b674e63dce5c', 'cascade-enterprises', '2025-07-01', 86.8, 'manual_entry')
ON CONFLICT DO NOTHING;

-- Readmission Rate
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  ('cfedc143-5f3e-4b56-b60f-267610d291f4', 'cascade-enterprises', '2024-08-01', 11.0, 'manual_entry'),
  ('cfedc143-5f3e-4b56-b60f-267610d291f4', 'cascade-enterprises', '2024-09-01', 10.8, 'manual_entry'),
  ('cfedc143-5f3e-4b56-b60f-267610d291f4', 'cascade-enterprises', '2024-10-01', 10.5, 'manual_entry'),
  ('cfedc143-5f3e-4b56-b60f-267610d291f4', 'cascade-enterprises', '2024-11-01', 10.2, 'manual_entry'),
  ('cfedc143-5f3e-4b56-b60f-267610d291f4', 'cascade-enterprises', '2024-12-01', 10.0, 'manual_entry'),
  ('cfedc143-5f3e-4b56-b60f-267610d291f4', 'cascade-enterprises', '2025-01-01', 9.8, 'manual_entry'),
  ('cfedc143-5f3e-4b56-b60f-267610d291f4', 'cascade-enterprises', '2025-02-01', 9.5, 'manual_entry'),
  ('cfedc143-5f3e-4b56-b60f-267610d291f4', 'cascade-enterprises', '2025-03-01', 9.2, 'manual_entry'),
  ('cfedc143-5f3e-4b56-b60f-267610d291f4', 'cascade-enterprises', '2025-04-01', 9.0, 'manual_entry'),
  ('cfedc143-5f3e-4b56-b60f-267610d291f4', 'cascade-enterprises', '2025-05-01', 8.7, 'manual_entry'),
  ('cfedc143-5f3e-4b56-b60f-267610d291f4', 'cascade-enterprises', '2025-06-01', 8.5, 'manual_entry'),
  ('cfedc143-5f3e-4b56-b60f-267610d291f4', 'cascade-enterprises', '2025-07-01', 8.2, 'manual_entry')
ON CONFLICT DO NOTHING;

-- Goal Achievement Rate
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  ('40a29df5-d620-447e-afe5-034b04dd85c8', 'cascade-enterprises', '2024-08-01', 75.0, 'manual_entry'),
  ('40a29df5-d620-447e-afe5-034b04dd85c8', 'cascade-enterprises', '2024-09-01', 75.8, 'manual_entry'),
  ('40a29df5-d620-447e-afe5-034b04dd85c8', 'cascade-enterprises', '2024-10-01', 76.5, 'manual_entry'),
  ('40a29df5-d620-447e-afe5-034b04dd85c8', 'cascade-enterprises', '2024-11-01', 77.0, 'manual_entry'),
  ('40a29df5-d620-447e-afe5-034b04dd85c8', 'cascade-enterprises', '2024-12-01', 77.8, 'manual_entry'),
  ('40a29df5-d620-447e-afe5-034b04dd85c8', 'cascade-enterprises', '2025-01-01', 78.5, 'manual_entry'),
  ('40a29df5-d620-447e-afe5-034b04dd85c8', 'cascade-enterprises', '2025-02-01', 79.2, 'manual_entry'),
  ('40a29df5-d620-447e-afe5-034b04dd85c8', 'cascade-enterprises', '2025-03-01', 80.0, 'manual_entry'),
  ('40a29df5-d620-447e-afe5-034b04dd85c8', 'cascade-enterprises', '2025-04-01', 80.5, 'manual_entry'),
  ('40a29df5-d620-447e-afe5-034b04dd85c8', 'cascade-enterprises', '2025-05-01', 81.2, 'manual_entry'),
  ('40a29df5-d620-447e-afe5-034b04dd85c8', 'cascade-enterprises', '2025-06-01', 82.0, 'manual_entry'),
  ('40a29df5-d620-447e-afe5-034b04dd85c8', 'cascade-enterprises', '2025-07-01', 82.8, 'manual_entry')
ON CONFLICT DO NOTHING;

-- Net Promoter Score
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  ('9f67b5cd-6395-4876-910d-53666b312a4a', 'cascade-enterprises', '2024-08-01', 58, 'manual_entry'),
  ('9f67b5cd-6395-4876-910d-53666b312a4a', 'cascade-enterprises', '2024-09-01', 59, 'manual_entry'),
  ('9f67b5cd-6395-4876-910d-53666b312a4a', 'cascade-enterprises', '2024-10-01', 60, 'manual_entry'),
  ('9f67b5cd-6395-4876-910d-53666b312a4a', 'cascade-enterprises', '2024-11-01', 61, 'manual_entry'),
  ('9f67b5cd-6395-4876-910d-53666b312a4a', 'cascade-enterprises', '2024-12-01', 62, 'manual_entry'),
  ('9f67b5cd-6395-4876-910d-53666b312a4a', 'cascade-enterprises', '2025-01-01', 63, 'manual_entry'),
  ('9f67b5cd-6395-4876-910d-53666b312a4a', 'cascade-enterprises', '2025-02-01', 64, 'manual_entry'),
  ('9f67b5cd-6395-4876-910d-53666b312a4a', 'cascade-enterprises', '2025-03-01', 65, 'manual_entry'),
  ('9f67b5cd-6395-4876-910d-53666b312a4a', 'cascade-enterprises', '2025-04-01', 65, 'manual_entry'),
  ('9f67b5cd-6395-4876-910d-53666b312a4a', 'cascade-enterprises', '2025-05-01', 66, 'manual_entry'),
  ('9f67b5cd-6395-4876-910d-53666b312a4a', 'cascade-enterprises', '2025-06-01', 67, 'manual_entry'),
  ('9f67b5cd-6395-4876-910d-53666b312a4a', 'cascade-enterprises', '2025-07-01', 68, 'manual_entry')
ON CONFLICT DO NOTHING;

-- Avg Response Time, Support Tickets, Staff Utilization, Avg Session Duration, Referral Rate, New Client Pipeline
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  -- Avg Response Time (hours)
  ('10df8f2a-354c-470a-b470-e73623a132f3', 'cascade-enterprises', '2024-08-01', 6.5, 'manual_entry'),
  ('10df8f2a-354c-470a-b470-e73623a132f3', 'cascade-enterprises', '2024-09-01', 6.2, 'manual_entry'),
  ('10df8f2a-354c-470a-b470-e73623a132f3', 'cascade-enterprises', '2024-10-01', 5.9, 'manual_entry'),
  ('10df8f2a-354c-470a-b470-e73623a132f3', 'cascade-enterprises', '2024-11-01', 5.7, 'manual_entry'),
  ('10df8f2a-354c-470a-b470-e73623a132f3', 'cascade-enterprises', '2024-12-01', 5.4, 'manual_entry'),
  ('10df8f2a-354c-470a-b470-e73623a132f3', 'cascade-enterprises', '2025-01-01', 5.1, 'manual_entry'),
  ('10df8f2a-354c-470a-b470-e73623a132f3', 'cascade-enterprises', '2025-02-01', 4.8, 'manual_entry'),
  ('10df8f2a-354c-470a-b470-e73623a132f3', 'cascade-enterprises', '2025-03-01', 4.6, 'manual_entry'),
  ('10df8f2a-354c-470a-b470-e73623a132f3', 'cascade-enterprises', '2025-04-01', 4.3, 'manual_entry'),
  ('10df8f2a-354c-470a-b470-e73623a132f3', 'cascade-enterprises', '2025-05-01', 4.1, 'manual_entry'),
  ('10df8f2a-354c-470a-b470-e73623a132f3', 'cascade-enterprises', '2025-06-01', 3.9, 'manual_entry'),
  ('10df8f2a-354c-470a-b470-e73623a132f3', 'cascade-enterprises', '2025-07-01', 3.8, 'manual_entry'),
  -- Support Ticket Volume
  ('21334239-fc4c-4a34-b0f7-ac26433224a0', 'cascade-enterprises', '2024-08-01', 180, 'manual_entry'),
  ('21334239-fc4c-4a34-b0f7-ac26433224a0', 'cascade-enterprises', '2024-09-01', 175, 'manual_entry'),
  ('21334239-fc4c-4a34-b0f7-ac26433224a0', 'cascade-enterprises', '2024-10-01', 168, 'manual_entry'),
  ('21334239-fc4c-4a34-b0f7-ac26433224a0', 'cascade-enterprises', '2024-11-01', 162, 'manual_entry'),
  ('21334239-fc4c-4a34-b0f7-ac26433224a0', 'cascade-enterprises', '2024-12-01', 158, 'manual_entry'),
  ('21334239-fc4c-4a34-b0f7-ac26433224a0', 'cascade-enterprises', '2025-01-01', 152, 'manual_entry'),
  ('21334239-fc4c-4a34-b0f7-ac26433224a0', 'cascade-enterprises', '2025-02-01', 148, 'manual_entry'),
  ('21334239-fc4c-4a34-b0f7-ac26433224a0', 'cascade-enterprises', '2025-03-01', 144, 'manual_entry'),
  ('21334239-fc4c-4a34-b0f7-ac26433224a0', 'cascade-enterprises', '2025-04-01', 140, 'manual_entry'),
  ('21334239-fc4c-4a34-b0f7-ac26433224a0', 'cascade-enterprises', '2025-05-01', 136, 'manual_entry'),
  ('21334239-fc4c-4a34-b0f7-ac26433224a0', 'cascade-enterprises', '2025-06-01', 134, 'manual_entry'),
  ('21334239-fc4c-4a34-b0f7-ac26433224a0', 'cascade-enterprises', '2025-07-01', 132, 'manual_entry'),
  -- Staff Utilization
  ('0bbf047b-316b-499b-8694-7ba776b03cc2', 'cascade-enterprises', '2024-08-01', 72.0, 'manual_entry'),
  ('0bbf047b-316b-499b-8694-7ba776b03cc2', 'cascade-enterprises', '2024-09-01', 72.5, 'manual_entry'),
  ('0bbf047b-316b-499b-8694-7ba776b03cc2', 'cascade-enterprises', '2024-10-01', 73.2, 'manual_entry'),
  ('0bbf047b-316b-499b-8694-7ba776b03cc2', 'cascade-enterprises', '2024-11-01', 73.8, 'manual_entry'),
  ('0bbf047b-316b-499b-8694-7ba776b03cc2', 'cascade-enterprises', '2024-12-01', 74.5, 'manual_entry'),
  ('0bbf047b-316b-499b-8694-7ba776b03cc2', 'cascade-enterprises', '2025-01-01', 75.0, 'manual_entry'),
  ('0bbf047b-316b-499b-8694-7ba776b03cc2', 'cascade-enterprises', '2025-02-01', 75.8, 'manual_entry'),
  ('0bbf047b-316b-499b-8694-7ba776b03cc2', 'cascade-enterprises', '2025-03-01', 76.5, 'manual_entry'),
  ('0bbf047b-316b-499b-8694-7ba776b03cc2', 'cascade-enterprises', '2025-04-01', 77.2, 'manual_entry'),
  ('0bbf047b-316b-499b-8694-7ba776b03cc2', 'cascade-enterprises', '2025-05-01', 78.0, 'manual_entry'),
  ('0bbf047b-316b-499b-8694-7ba776b03cc2', 'cascade-enterprises', '2025-06-01', 79.0, 'manual_entry'),
  ('0bbf047b-316b-499b-8694-7ba776b03cc2', 'cascade-enterprises', '2025-07-01', 79.8, 'manual_entry'),
  -- Avg Session Duration (minutes)
  ('f86f2805-5a02-47bc-89de-1f31830bcce1', 'cascade-enterprises', '2024-08-01', 38.0, 'manual_entry'),
  ('f86f2805-5a02-47bc-89de-1f31830bcce1', 'cascade-enterprises', '2024-09-01', 38.5, 'manual_entry'),
  ('f86f2805-5a02-47bc-89de-1f31830bcce1', 'cascade-enterprises', '2024-10-01', 39.0, 'manual_entry'),
  ('f86f2805-5a02-47bc-89de-1f31830bcce1', 'cascade-enterprises', '2024-11-01', 39.5, 'manual_entry'),
  ('f86f2805-5a02-47bc-89de-1f31830bcce1', 'cascade-enterprises', '2024-12-01', 40.0, 'manual_entry'),
  ('f86f2805-5a02-47bc-89de-1f31830bcce1', 'cascade-enterprises', '2025-01-01', 40.2, 'manual_entry'),
  ('f86f2805-5a02-47bc-89de-1f31830bcce1', 'cascade-enterprises', '2025-02-01', 40.8, 'manual_entry'),
  ('f86f2805-5a02-47bc-89de-1f31830bcce1', 'cascade-enterprises', '2025-03-01', 41.2, 'manual_entry'),
  ('f86f2805-5a02-47bc-89de-1f31830bcce1', 'cascade-enterprises', '2025-04-01', 41.8, 'manual_entry'),
  ('f86f2805-5a02-47bc-89de-1f31830bcce1', 'cascade-enterprises', '2025-05-01', 42.2, 'manual_entry'),
  ('f86f2805-5a02-47bc-89de-1f31830bcce1', 'cascade-enterprises', '2025-06-01', 42.5, 'manual_entry'),
  ('f86f2805-5a02-47bc-89de-1f31830bcce1', 'cascade-enterprises', '2025-07-01', 43.0, 'manual_entry'),
  -- Referral Rate
  ('7c7086e7-6080-4b1f-b7cd-e76a8a054c95', 'cascade-enterprises', '2024-08-01', 15.2, 'manual_entry'),
  ('7c7086e7-6080-4b1f-b7cd-e76a8a054c95', 'cascade-enterprises', '2024-09-01', 15.8, 'manual_entry'),
  ('7c7086e7-6080-4b1f-b7cd-e76a8a054c95', 'cascade-enterprises', '2024-10-01', 16.5, 'manual_entry'),
  ('7c7086e7-6080-4b1f-b7cd-e76a8a054c95', 'cascade-enterprises', '2024-11-01', 17.0, 'manual_entry'),
  ('7c7086e7-6080-4b1f-b7cd-e76a8a054c95', 'cascade-enterprises', '2024-12-01', 17.5, 'manual_entry'),
  ('7c7086e7-6080-4b1f-b7cd-e76a8a054c95', 'cascade-enterprises', '2025-01-01', 18.2, 'manual_entry'),
  ('7c7086e7-6080-4b1f-b7cd-e76a8a054c95', 'cascade-enterprises', '2025-02-01', 18.8, 'manual_entry'),
  ('7c7086e7-6080-4b1f-b7cd-e76a8a054c95', 'cascade-enterprises', '2025-03-01', 19.5, 'manual_entry'),
  ('7c7086e7-6080-4b1f-b7cd-e76a8a054c95', 'cascade-enterprises', '2025-04-01', 20.0, 'manual_entry'),
  ('7c7086e7-6080-4b1f-b7cd-e76a8a054c95', 'cascade-enterprises', '2025-05-01', 20.5, 'manual_entry'),
  ('7c7086e7-6080-4b1f-b7cd-e76a8a054c95', 'cascade-enterprises', '2025-06-01', 21.2, 'manual_entry'),
  ('7c7086e7-6080-4b1f-b7cd-e76a8a054c95', 'cascade-enterprises', '2025-07-01', 21.8, 'manual_entry'),
  -- New Client Pipeline
  ('5ea0bcd5-0995-4f5f-aa43-c3ca6d1ea0bf', 'cascade-enterprises', '2024-08-01', 22, 'manual_entry'),
  ('5ea0bcd5-0995-4f5f-aa43-c3ca6d1ea0bf', 'cascade-enterprises', '2024-09-01', 24, 'manual_entry'),
  ('5ea0bcd5-0995-4f5f-aa43-c3ca6d1ea0bf', 'cascade-enterprises', '2024-10-01', 25, 'manual_entry'),
  ('5ea0bcd5-0995-4f5f-aa43-c3ca6d1ea0bf', 'cascade-enterprises', '2024-11-01', 24, 'manual_entry'),
  ('5ea0bcd5-0995-4f5f-aa43-c3ca6d1ea0bf', 'cascade-enterprises', '2024-12-01', 26, 'manual_entry'),
  ('5ea0bcd5-0995-4f5f-aa43-c3ca6d1ea0bf', 'cascade-enterprises', '2025-01-01', 28, 'manual_entry'),
  ('5ea0bcd5-0995-4f5f-aa43-c3ca6d1ea0bf', 'cascade-enterprises', '2025-02-01', 29, 'manual_entry'),
  ('5ea0bcd5-0995-4f5f-aa43-c3ca6d1ea0bf', 'cascade-enterprises', '2025-03-01', 30, 'manual_entry'),
  ('5ea0bcd5-0995-4f5f-aa43-c3ca6d1ea0bf', 'cascade-enterprises', '2025-04-01', 31, 'manual_entry'),
  ('5ea0bcd5-0995-4f5f-aa43-c3ca6d1ea0bf', 'cascade-enterprises', '2025-05-01', 32, 'manual_entry'),
  ('5ea0bcd5-0995-4f5f-aa43-c3ca6d1ea0bf', 'cascade-enterprises', '2025-06-01', 34, 'manual_entry'),
  ('5ea0bcd5-0995-4f5f-aa43-c3ca6d1ea0bf', 'cascade-enterprises', '2025-07-01', 35, 'manual_entry')
ON CONFLICT DO NOTHING;
