/*
  # Seed Realistic Historical Data for Summit Partners Group

  Summit Partners Group is an early-stage, fast-growing client.
  Data covers Aug 2024 - Jul 2025 (12 months).

  Profile:
  - Revenue growing steeply from ~$65K to ~$115K
  - Profit margins from 28% to 35%
  - Patient satisfaction from 74% to 84%
  - NPS from 48 to 62
  - Fast enrollment growth (8.5% to 14.2%)
*/

-- Fill missing months for existing metrics

-- Monthly Enrollments: fill Feb-Jul 2025 (has Aug 2024 - Jan 2025)
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  ('8e8e37d1-b52b-4ae7-a9bc-9684813acc75', 'summit-partners-group', '2025-02-01', 38, 'manual_entry'),
  ('8e8e37d1-b52b-4ae7-a9bc-9684813acc75', 'summit-partners-group', '2025-03-01', 42, 'manual_entry'),
  ('8e8e37d1-b52b-4ae7-a9bc-9684813acc75', 'summit-partners-group', '2025-04-01', 45, 'manual_entry'),
  ('8e8e37d1-b52b-4ae7-a9bc-9684813acc75', 'summit-partners-group', '2025-05-01', 48, 'manual_entry'),
  ('8e8e37d1-b52b-4ae7-a9bc-9684813acc75', 'summit-partners-group', '2025-06-01', 52, 'manual_entry'),
  ('8e8e37d1-b52b-4ae7-a9bc-9684813acc75', 'summit-partners-group', '2025-07-01', 56, 'manual_entry')
ON CONFLICT DO NOTHING;

-- Active Participants: fill Feb-Jul 2025
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  ('2710e3c7-ef3d-4391-80ca-311e8bd4fd4c', 'summit-partners-group', '2025-02-01', 285, 'manual_entry'),
  ('2710e3c7-ef3d-4391-80ca-311e8bd4fd4c', 'summit-partners-group', '2025-03-01', 310, 'manual_entry'),
  ('2710e3c7-ef3d-4391-80ca-311e8bd4fd4c', 'summit-partners-group', '2025-04-01', 338, 'manual_entry'),
  ('2710e3c7-ef3d-4391-80ca-311e8bd4fd4c', 'summit-partners-group', '2025-05-01', 365, 'manual_entry'),
  ('2710e3c7-ef3d-4391-80ca-311e8bd4fd4c', 'summit-partners-group', '2025-06-01', 392, 'manual_entry'),
  ('2710e3c7-ef3d-4391-80ca-311e8bd4fd4c', 'summit-partners-group', '2025-07-01', 420, 'manual_entry')
ON CONFLICT DO NOTHING;

-- Monthly Revenue: fill Feb-Jul 2025
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  ('afb9eb99-e724-442b-948a-4b619cbe53ab', 'summit-partners-group', '2025-02-01', 82500, 'manual_entry'),
  ('afb9eb99-e724-442b-948a-4b619cbe53ab', 'summit-partners-group', '2025-03-01', 88200, 'manual_entry'),
  ('afb9eb99-e724-442b-948a-4b619cbe53ab', 'summit-partners-group', '2025-04-01', 94800, 'manual_entry'),
  ('afb9eb99-e724-442b-948a-4b619cbe53ab', 'summit-partners-group', '2025-05-01', 101500, 'manual_entry'),
  ('afb9eb99-e724-442b-948a-4b619cbe53ab', 'summit-partners-group', '2025-06-01', 108200, 'manual_entry'),
  ('afb9eb99-e724-442b-948a-4b619cbe53ab', 'summit-partners-group', '2025-07-01', 115000, 'manual_entry')
ON CONFLICT DO NOTHING;

-- Service Volume: fill Feb-Jul 2025
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  ('8a927d0d-7700-4ad7-a067-34ddecd9a0b9', 'summit-partners-group', '2025-02-01', 345, 'manual_entry'),
  ('8a927d0d-7700-4ad7-a067-34ddecd9a0b9', 'summit-partners-group', '2025-03-01', 372, 'manual_entry'),
  ('8a927d0d-7700-4ad7-a067-34ddecd9a0b9', 'summit-partners-group', '2025-04-01', 398, 'manual_entry'),
  ('8a927d0d-7700-4ad7-a067-34ddecd9a0b9', 'summit-partners-group', '2025-05-01', 425, 'manual_entry'),
  ('8a927d0d-7700-4ad7-a067-34ddecd9a0b9', 'summit-partners-group', '2025-06-01', 452, 'manual_entry'),
  ('8a927d0d-7700-4ad7-a067-34ddecd9a0b9', 'summit-partners-group', '2025-07-01', 480, 'manual_entry')
ON CONFLICT DO NOTHING;

-- Enrollment Growth Rate
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  ('cae9adc8-f821-45c6-992b-88a07668645e', 'summit-partners-group', '2024-08-01', 8.5, 'manual_entry'),
  ('cae9adc8-f821-45c6-992b-88a07668645e', 'summit-partners-group', '2024-09-01', 9.0, 'manual_entry'),
  ('cae9adc8-f821-45c6-992b-88a07668645e', 'summit-partners-group', '2024-10-01', 9.5, 'manual_entry'),
  ('cae9adc8-f821-45c6-992b-88a07668645e', 'summit-partners-group', '2024-11-01', 9.2, 'manual_entry'),
  ('cae9adc8-f821-45c6-992b-88a07668645e', 'summit-partners-group', '2024-12-01', 10.1, 'manual_entry'),
  ('cae9adc8-f821-45c6-992b-88a07668645e', 'summit-partners-group', '2025-01-01', 10.8, 'manual_entry'),
  ('cae9adc8-f821-45c6-992b-88a07668645e', 'summit-partners-group', '2025-02-01', 11.2, 'manual_entry'),
  ('cae9adc8-f821-45c6-992b-88a07668645e', 'summit-partners-group', '2025-03-01', 11.8, 'manual_entry'),
  ('cae9adc8-f821-45c6-992b-88a07668645e', 'summit-partners-group', '2025-04-01', 12.5, 'manual_entry'),
  ('cae9adc8-f821-45c6-992b-88a07668645e', 'summit-partners-group', '2025-05-01', 13.0, 'manual_entry'),
  ('cae9adc8-f821-45c6-992b-88a07668645e', 'summit-partners-group', '2025-06-01', 13.5, 'manual_entry'),
  ('cae9adc8-f821-45c6-992b-88a07668645e', 'summit-partners-group', '2025-07-01', 14.2, 'manual_entry')
ON CONFLICT DO NOTHING;

-- Patient Retention Rate
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  ('392b2d37-165b-4eab-b3a7-06f4af36e99d', 'summit-partners-group', '2024-08-01', 78.0, 'manual_entry'),
  ('392b2d37-165b-4eab-b3a7-06f4af36e99d', 'summit-partners-group', '2024-09-01', 78.8, 'manual_entry'),
  ('392b2d37-165b-4eab-b3a7-06f4af36e99d', 'summit-partners-group', '2024-10-01', 79.5, 'manual_entry'),
  ('392b2d37-165b-4eab-b3a7-06f4af36e99d', 'summit-partners-group', '2024-11-01', 80.2, 'manual_entry'),
  ('392b2d37-165b-4eab-b3a7-06f4af36e99d', 'summit-partners-group', '2024-12-01', 81.0, 'manual_entry'),
  ('392b2d37-165b-4eab-b3a7-06f4af36e99d', 'summit-partners-group', '2025-01-01', 81.8, 'manual_entry'),
  ('392b2d37-165b-4eab-b3a7-06f4af36e99d', 'summit-partners-group', '2025-02-01', 82.5, 'manual_entry'),
  ('392b2d37-165b-4eab-b3a7-06f4af36e99d', 'summit-partners-group', '2025-03-01', 83.2, 'manual_entry'),
  ('392b2d37-165b-4eab-b3a7-06f4af36e99d', 'summit-partners-group', '2025-04-01', 84.0, 'manual_entry'),
  ('392b2d37-165b-4eab-b3a7-06f4af36e99d', 'summit-partners-group', '2025-05-01', 84.8, 'manual_entry'),
  ('392b2d37-165b-4eab-b3a7-06f4af36e99d', 'summit-partners-group', '2025-06-01', 85.5, 'manual_entry'),
  ('392b2d37-165b-4eab-b3a7-06f4af36e99d', 'summit-partners-group', '2025-07-01', 86.5, 'manual_entry')
ON CONFLICT DO NOTHING;

-- All new metrics for summit-partners-group
INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
VALUES
  -- Operating Costs
  ('0d0ea7df-fd23-4433-b468-d94c90ea1422', 'summit-partners-group', '2024-08-01', 52000, 'manual_entry'),
  ('0d0ea7df-fd23-4433-b468-d94c90ea1422', 'summit-partners-group', '2024-09-01', 54200, 'manual_entry'),
  ('0d0ea7df-fd23-4433-b468-d94c90ea1422', 'summit-partners-group', '2024-10-01', 56500, 'manual_entry'),
  ('0d0ea7df-fd23-4433-b468-d94c90ea1422', 'summit-partners-group', '2024-11-01', 58200, 'manual_entry'),
  ('0d0ea7df-fd23-4433-b468-d94c90ea1422', 'summit-partners-group', '2024-12-01', 60800, 'manual_entry'),
  ('0d0ea7df-fd23-4433-b468-d94c90ea1422', 'summit-partners-group', '2025-01-01', 63000, 'manual_entry'),
  ('0d0ea7df-fd23-4433-b468-d94c90ea1422', 'summit-partners-group', '2025-02-01', 65200, 'manual_entry'),
  ('0d0ea7df-fd23-4433-b468-d94c90ea1422', 'summit-partners-group', '2025-03-01', 67500, 'manual_entry'),
  ('0d0ea7df-fd23-4433-b468-d94c90ea1422', 'summit-partners-group', '2025-04-01', 69800, 'manual_entry'),
  ('0d0ea7df-fd23-4433-b468-d94c90ea1422', 'summit-partners-group', '2025-05-01', 72200, 'manual_entry'),
  ('0d0ea7df-fd23-4433-b468-d94c90ea1422', 'summit-partners-group', '2025-06-01', 74800, 'manual_entry'),
  ('0d0ea7df-fd23-4433-b468-d94c90ea1422', 'summit-partners-group', '2025-07-01', 77500, 'manual_entry'),
  -- Profit Margin
  ('236dbc9e-9b33-47c2-ab65-fd57bd486666', 'summit-partners-group', '2024-08-01', 28.0, 'manual_entry'),
  ('236dbc9e-9b33-47c2-ab65-fd57bd486666', 'summit-partners-group', '2024-09-01', 28.5, 'manual_entry'),
  ('236dbc9e-9b33-47c2-ab65-fd57bd486666', 'summit-partners-group', '2024-10-01', 29.0, 'manual_entry'),
  ('236dbc9e-9b33-47c2-ab65-fd57bd486666', 'summit-partners-group', '2024-11-01', 29.2, 'manual_entry'),
  ('236dbc9e-9b33-47c2-ab65-fd57bd486666', 'summit-partners-group', '2024-12-01', 29.8, 'manual_entry'),
  ('236dbc9e-9b33-47c2-ab65-fd57bd486666', 'summit-partners-group', '2025-01-01', 30.5, 'manual_entry'),
  ('236dbc9e-9b33-47c2-ab65-fd57bd486666', 'summit-partners-group', '2025-02-01', 31.0, 'manual_entry'),
  ('236dbc9e-9b33-47c2-ab65-fd57bd486666', 'summit-partners-group', '2025-03-01', 31.8, 'manual_entry'),
  ('236dbc9e-9b33-47c2-ab65-fd57bd486666', 'summit-partners-group', '2025-04-01', 32.5, 'manual_entry'),
  ('236dbc9e-9b33-47c2-ab65-fd57bd486666', 'summit-partners-group', '2025-05-01', 33.2, 'manual_entry'),
  ('236dbc9e-9b33-47c2-ab65-fd57bd486666', 'summit-partners-group', '2025-06-01', 34.0, 'manual_entry'),
  ('236dbc9e-9b33-47c2-ab65-fd57bd486666', 'summit-partners-group', '2025-07-01', 34.8, 'manual_entry'),
  -- Revenue Per Client
  ('9a8ba2dd-b5b3-40f9-aafb-9dbe33bc44d0', 'summit-partners-group', '2024-08-01', 320, 'manual_entry'),
  ('9a8ba2dd-b5b3-40f9-aafb-9dbe33bc44d0', 'summit-partners-group', '2024-09-01', 328, 'manual_entry'),
  ('9a8ba2dd-b5b3-40f9-aafb-9dbe33bc44d0', 'summit-partners-group', '2024-10-01', 338, 'manual_entry'),
  ('9a8ba2dd-b5b3-40f9-aafb-9dbe33bc44d0', 'summit-partners-group', '2024-11-01', 345, 'manual_entry'),
  ('9a8ba2dd-b5b3-40f9-aafb-9dbe33bc44d0', 'summit-partners-group', '2024-12-01', 355, 'manual_entry'),
  ('9a8ba2dd-b5b3-40f9-aafb-9dbe33bc44d0', 'summit-partners-group', '2025-01-01', 365, 'manual_entry'),
  ('9a8ba2dd-b5b3-40f9-aafb-9dbe33bc44d0', 'summit-partners-group', '2025-02-01', 372, 'manual_entry'),
  ('9a8ba2dd-b5b3-40f9-aafb-9dbe33bc44d0', 'summit-partners-group', '2025-03-01', 380, 'manual_entry'),
  ('9a8ba2dd-b5b3-40f9-aafb-9dbe33bc44d0', 'summit-partners-group', '2025-04-01', 388, 'manual_entry'),
  ('9a8ba2dd-b5b3-40f9-aafb-9dbe33bc44d0', 'summit-partners-group', '2025-05-01', 395, 'manual_entry'),
  ('9a8ba2dd-b5b3-40f9-aafb-9dbe33bc44d0', 'summit-partners-group', '2025-06-01', 402, 'manual_entry'),
  ('9a8ba2dd-b5b3-40f9-aafb-9dbe33bc44d0', 'summit-partners-group', '2025-07-01', 410, 'manual_entry'),
  -- Cost Per Acquisition
  ('46cef6b3-c78a-49b5-beb5-14018786d073', 'summit-partners-group', '2024-08-01', 1050, 'manual_entry'),
  ('46cef6b3-c78a-49b5-beb5-14018786d073', 'summit-partners-group', '2024-09-01', 1030, 'manual_entry'),
  ('46cef6b3-c78a-49b5-beb5-14018786d073', 'summit-partners-group', '2024-10-01', 1010, 'manual_entry'),
  ('46cef6b3-c78a-49b5-beb5-14018786d073', 'summit-partners-group', '2024-11-01', 995, 'manual_entry'),
  ('46cef6b3-c78a-49b5-beb5-14018786d073', 'summit-partners-group', '2024-12-01', 978, 'manual_entry'),
  ('46cef6b3-c78a-49b5-beb5-14018786d073', 'summit-partners-group', '2025-01-01', 960, 'manual_entry'),
  ('46cef6b3-c78a-49b5-beb5-14018786d073', 'summit-partners-group', '2025-02-01', 945, 'manual_entry'),
  ('46cef6b3-c78a-49b5-beb5-14018786d073', 'summit-partners-group', '2025-03-01', 928, 'manual_entry'),
  ('46cef6b3-c78a-49b5-beb5-14018786d073', 'summit-partners-group', '2025-04-01', 912, 'manual_entry'),
  ('46cef6b3-c78a-49b5-beb5-14018786d073', 'summit-partners-group', '2025-05-01', 898, 'manual_entry'),
  ('46cef6b3-c78a-49b5-beb5-14018786d073', 'summit-partners-group', '2025-06-01', 888, 'manual_entry'),
  ('46cef6b3-c78a-49b5-beb5-14018786d073', 'summit-partners-group', '2025-07-01', 878, 'manual_entry'),
  -- Patient Satisfaction Score
  ('4fd08c7e-9dad-4563-b189-b5c3ce13bf1a', 'summit-partners-group', '2024-08-01', 74.0, 'manual_entry'),
  ('4fd08c7e-9dad-4563-b189-b5c3ce13bf1a', 'summit-partners-group', '2024-09-01', 74.8, 'manual_entry'),
  ('4fd08c7e-9dad-4563-b189-b5c3ce13bf1a', 'summit-partners-group', '2024-10-01', 75.5, 'manual_entry'),
  ('4fd08c7e-9dad-4563-b189-b5c3ce13bf1a', 'summit-partners-group', '2024-11-01', 76.2, 'manual_entry'),
  ('4fd08c7e-9dad-4563-b189-b5c3ce13bf1a', 'summit-partners-group', '2024-12-01', 77.0, 'manual_entry'),
  ('4fd08c7e-9dad-4563-b189-b5c3ce13bf1a', 'summit-partners-group', '2025-01-01', 78.0, 'manual_entry'),
  ('4fd08c7e-9dad-4563-b189-b5c3ce13bf1a', 'summit-partners-group', '2025-02-01', 79.0, 'manual_entry'),
  ('4fd08c7e-9dad-4563-b189-b5c3ce13bf1a', 'summit-partners-group', '2025-03-01', 80.0, 'manual_entry'),
  ('4fd08c7e-9dad-4563-b189-b5c3ce13bf1a', 'summit-partners-group', '2025-04-01', 81.0, 'manual_entry'),
  ('4fd08c7e-9dad-4563-b189-b5c3ce13bf1a', 'summit-partners-group', '2025-05-01', 82.0, 'manual_entry'),
  ('4fd08c7e-9dad-4563-b189-b5c3ce13bf1a', 'summit-partners-group', '2025-06-01', 83.2, 'manual_entry'),
  ('4fd08c7e-9dad-4563-b189-b5c3ce13bf1a', 'summit-partners-group', '2025-07-01', 84.0, 'manual_entry'),
  -- Readmission Rate
  ('b659b3f5-6070-4f65-be17-980331398526', 'summit-partners-group', '2024-08-01', 14.0, 'manual_entry'),
  ('b659b3f5-6070-4f65-be17-980331398526', 'summit-partners-group', '2024-09-01', 13.5, 'manual_entry'),
  ('b659b3f5-6070-4f65-be17-980331398526', 'summit-partners-group', '2024-10-01', 13.0, 'manual_entry'),
  ('b659b3f5-6070-4f65-be17-980331398526', 'summit-partners-group', '2024-11-01', 12.8, 'manual_entry'),
  ('b659b3f5-6070-4f65-be17-980331398526', 'summit-partners-group', '2024-12-01', 12.2, 'manual_entry'),
  ('b659b3f5-6070-4f65-be17-980331398526', 'summit-partners-group', '2025-01-01', 11.8, 'manual_entry'),
  ('b659b3f5-6070-4f65-be17-980331398526', 'summit-partners-group', '2025-02-01', 11.5, 'manual_entry'),
  ('b659b3f5-6070-4f65-be17-980331398526', 'summit-partners-group', '2025-03-01', 11.0, 'manual_entry'),
  ('b659b3f5-6070-4f65-be17-980331398526', 'summit-partners-group', '2025-04-01', 10.8, 'manual_entry'),
  ('b659b3f5-6070-4f65-be17-980331398526', 'summit-partners-group', '2025-05-01', 10.5, 'manual_entry'),
  ('b659b3f5-6070-4f65-be17-980331398526', 'summit-partners-group', '2025-06-01', 10.2, 'manual_entry'),
  ('b659b3f5-6070-4f65-be17-980331398526', 'summit-partners-group', '2025-07-01', 10.0, 'manual_entry'),
  -- Goal Achievement Rate
  ('58a2459c-4c12-42e0-87d2-2f3575a6297e', 'summit-partners-group', '2024-08-01', 68.0, 'manual_entry'),
  ('58a2459c-4c12-42e0-87d2-2f3575a6297e', 'summit-partners-group', '2024-09-01', 69.2, 'manual_entry'),
  ('58a2459c-4c12-42e0-87d2-2f3575a6297e', 'summit-partners-group', '2024-10-01', 70.5, 'manual_entry'),
  ('58a2459c-4c12-42e0-87d2-2f3575a6297e', 'summit-partners-group', '2024-11-01', 71.0, 'manual_entry'),
  ('58a2459c-4c12-42e0-87d2-2f3575a6297e', 'summit-partners-group', '2024-12-01', 72.5, 'manual_entry'),
  ('58a2459c-4c12-42e0-87d2-2f3575a6297e', 'summit-partners-group', '2025-01-01', 73.8, 'manual_entry'),
  ('58a2459c-4c12-42e0-87d2-2f3575a6297e', 'summit-partners-group', '2025-02-01', 74.5, 'manual_entry'),
  ('58a2459c-4c12-42e0-87d2-2f3575a6297e', 'summit-partners-group', '2025-03-01', 75.8, 'manual_entry'),
  ('58a2459c-4c12-42e0-87d2-2f3575a6297e', 'summit-partners-group', '2025-04-01', 76.5, 'manual_entry'),
  ('58a2459c-4c12-42e0-87d2-2f3575a6297e', 'summit-partners-group', '2025-05-01', 77.8, 'manual_entry'),
  ('58a2459c-4c12-42e0-87d2-2f3575a6297e', 'summit-partners-group', '2025-06-01', 79.0, 'manual_entry'),
  ('58a2459c-4c12-42e0-87d2-2f3575a6297e', 'summit-partners-group', '2025-07-01', 80.2, 'manual_entry'),
  -- Net Promoter Score
  ('1a348355-cbda-45ed-8191-34653e5d964c', 'summit-partners-group', '2024-08-01', 48, 'manual_entry'),
  ('1a348355-cbda-45ed-8191-34653e5d964c', 'summit-partners-group', '2024-09-01', 49, 'manual_entry'),
  ('1a348355-cbda-45ed-8191-34653e5d964c', 'summit-partners-group', '2024-10-01', 50, 'manual_entry'),
  ('1a348355-cbda-45ed-8191-34653e5d964c', 'summit-partners-group', '2024-11-01', 51, 'manual_entry'),
  ('1a348355-cbda-45ed-8191-34653e5d964c', 'summit-partners-group', '2024-12-01', 53, 'manual_entry'),
  ('1a348355-cbda-45ed-8191-34653e5d964c', 'summit-partners-group', '2025-01-01', 54, 'manual_entry'),
  ('1a348355-cbda-45ed-8191-34653e5d964c', 'summit-partners-group', '2025-02-01', 55, 'manual_entry'),
  ('1a348355-cbda-45ed-8191-34653e5d964c', 'summit-partners-group', '2025-03-01', 57, 'manual_entry'),
  ('1a348355-cbda-45ed-8191-34653e5d964c', 'summit-partners-group', '2025-04-01', 58, 'manual_entry'),
  ('1a348355-cbda-45ed-8191-34653e5d964c', 'summit-partners-group', '2025-05-01', 59, 'manual_entry'),
  ('1a348355-cbda-45ed-8191-34653e5d964c', 'summit-partners-group', '2025-06-01', 61, 'manual_entry'),
  ('1a348355-cbda-45ed-8191-34653e5d964c', 'summit-partners-group', '2025-07-01', 62, 'manual_entry'),
  -- Avg Response Time
  ('0fdb75cc-b393-4f5d-ae2f-4343ec0d9876', 'summit-partners-group', '2024-08-01', 8.5, 'manual_entry'),
  ('0fdb75cc-b393-4f5d-ae2f-4343ec0d9876', 'summit-partners-group', '2024-09-01', 8.0, 'manual_entry'),
  ('0fdb75cc-b393-4f5d-ae2f-4343ec0d9876', 'summit-partners-group', '2024-10-01', 7.5, 'manual_entry'),
  ('0fdb75cc-b393-4f5d-ae2f-4343ec0d9876', 'summit-partners-group', '2024-11-01', 7.2, 'manual_entry'),
  ('0fdb75cc-b393-4f5d-ae2f-4343ec0d9876', 'summit-partners-group', '2024-12-01', 6.8, 'manual_entry'),
  ('0fdb75cc-b393-4f5d-ae2f-4343ec0d9876', 'summit-partners-group', '2025-01-01', 6.2, 'manual_entry'),
  ('0fdb75cc-b393-4f5d-ae2f-4343ec0d9876', 'summit-partners-group', '2025-02-01', 5.8, 'manual_entry'),
  ('0fdb75cc-b393-4f5d-ae2f-4343ec0d9876', 'summit-partners-group', '2025-03-01', 5.5, 'manual_entry'),
  ('0fdb75cc-b393-4f5d-ae2f-4343ec0d9876', 'summit-partners-group', '2025-04-01', 5.2, 'manual_entry'),
  ('0fdb75cc-b393-4f5d-ae2f-4343ec0d9876', 'summit-partners-group', '2025-05-01', 4.8, 'manual_entry'),
  ('0fdb75cc-b393-4f5d-ae2f-4343ec0d9876', 'summit-partners-group', '2025-06-01', 4.5, 'manual_entry'),
  ('0fdb75cc-b393-4f5d-ae2f-4343ec0d9876', 'summit-partners-group', '2025-07-01', 4.2, 'manual_entry'),
  -- Support Ticket Volume (growing with client base)
  ('5d305a13-a23d-4af9-ae70-d8dfcff1721f', 'summit-partners-group', '2024-08-01', 95, 'manual_entry'),
  ('5d305a13-a23d-4af9-ae70-d8dfcff1721f', 'summit-partners-group', '2024-09-01', 98, 'manual_entry'),
  ('5d305a13-a23d-4af9-ae70-d8dfcff1721f', 'summit-partners-group', '2024-10-01', 100, 'manual_entry'),
  ('5d305a13-a23d-4af9-ae70-d8dfcff1721f', 'summit-partners-group', '2024-11-01', 102, 'manual_entry'),
  ('5d305a13-a23d-4af9-ae70-d8dfcff1721f', 'summit-partners-group', '2024-12-01', 105, 'manual_entry'),
  ('5d305a13-a23d-4af9-ae70-d8dfcff1721f', 'summit-partners-group', '2025-01-01', 108, 'manual_entry'),
  ('5d305a13-a23d-4af9-ae70-d8dfcff1721f', 'summit-partners-group', '2025-02-01', 110, 'manual_entry'),
  ('5d305a13-a23d-4af9-ae70-d8dfcff1721f', 'summit-partners-group', '2025-03-01', 112, 'manual_entry'),
  ('5d305a13-a23d-4af9-ae70-d8dfcff1721f', 'summit-partners-group', '2025-04-01', 114, 'manual_entry'),
  ('5d305a13-a23d-4af9-ae70-d8dfcff1721f', 'summit-partners-group', '2025-05-01', 116, 'manual_entry'),
  ('5d305a13-a23d-4af9-ae70-d8dfcff1721f', 'summit-partners-group', '2025-06-01', 118, 'manual_entry'),
  ('5d305a13-a23d-4af9-ae70-d8dfcff1721f', 'summit-partners-group', '2025-07-01', 120, 'manual_entry'),
  -- Staff Utilization
  ('c97af57a-9a7a-4f52-af76-ecfa21683dca', 'summit-partners-group', '2024-08-01', 65.0, 'manual_entry'),
  ('c97af57a-9a7a-4f52-af76-ecfa21683dca', 'summit-partners-group', '2024-09-01', 66.2, 'manual_entry'),
  ('c97af57a-9a7a-4f52-af76-ecfa21683dca', 'summit-partners-group', '2024-10-01', 67.5, 'manual_entry'),
  ('c97af57a-9a7a-4f52-af76-ecfa21683dca', 'summit-partners-group', '2024-11-01', 68.8, 'manual_entry'),
  ('c97af57a-9a7a-4f52-af76-ecfa21683dca', 'summit-partners-group', '2024-12-01', 70.0, 'manual_entry'),
  ('c97af57a-9a7a-4f52-af76-ecfa21683dca', 'summit-partners-group', '2025-01-01', 71.2, 'manual_entry'),
  ('c97af57a-9a7a-4f52-af76-ecfa21683dca', 'summit-partners-group', '2025-02-01', 72.5, 'manual_entry'),
  ('c97af57a-9a7a-4f52-af76-ecfa21683dca', 'summit-partners-group', '2025-03-01', 73.5, 'manual_entry'),
  ('c97af57a-9a7a-4f52-af76-ecfa21683dca', 'summit-partners-group', '2025-04-01', 74.8, 'manual_entry'),
  ('c97af57a-9a7a-4f52-af76-ecfa21683dca', 'summit-partners-group', '2025-05-01', 75.8, 'manual_entry'),
  ('c97af57a-9a7a-4f52-af76-ecfa21683dca', 'summit-partners-group', '2025-06-01', 77.0, 'manual_entry'),
  ('c97af57a-9a7a-4f52-af76-ecfa21683dca', 'summit-partners-group', '2025-07-01', 78.2, 'manual_entry'),
  -- Avg Session Duration
  ('cefe9e80-1a92-4766-95f4-dfe0fb2f06a4', 'summit-partners-group', '2024-08-01', 35.0, 'manual_entry'),
  ('cefe9e80-1a92-4766-95f4-dfe0fb2f06a4', 'summit-partners-group', '2024-09-01', 35.5, 'manual_entry'),
  ('cefe9e80-1a92-4766-95f4-dfe0fb2f06a4', 'summit-partners-group', '2024-10-01', 36.2, 'manual_entry'),
  ('cefe9e80-1a92-4766-95f4-dfe0fb2f06a4', 'summit-partners-group', '2024-11-01', 36.8, 'manual_entry'),
  ('cefe9e80-1a92-4766-95f4-dfe0fb2f06a4', 'summit-partners-group', '2024-12-01', 37.5, 'manual_entry'),
  ('cefe9e80-1a92-4766-95f4-dfe0fb2f06a4', 'summit-partners-group', '2025-01-01', 38.0, 'manual_entry'),
  ('cefe9e80-1a92-4766-95f4-dfe0fb2f06a4', 'summit-partners-group', '2025-02-01', 38.8, 'manual_entry'),
  ('cefe9e80-1a92-4766-95f4-dfe0fb2f06a4', 'summit-partners-group', '2025-03-01', 39.5, 'manual_entry'),
  ('cefe9e80-1a92-4766-95f4-dfe0fb2f06a4', 'summit-partners-group', '2025-04-01', 40.0, 'manual_entry'),
  ('cefe9e80-1a92-4766-95f4-dfe0fb2f06a4', 'summit-partners-group', '2025-05-01', 40.8, 'manual_entry'),
  ('cefe9e80-1a92-4766-95f4-dfe0fb2f06a4', 'summit-partners-group', '2025-06-01', 41.5, 'manual_entry'),
  ('cefe9e80-1a92-4766-95f4-dfe0fb2f06a4', 'summit-partners-group', '2025-07-01', 42.0, 'manual_entry'),
  -- Referral Rate
  ('79ae2172-1e7b-4f2d-8466-9e8244098565', 'summit-partners-group', '2024-08-01', 12.0, 'manual_entry'),
  ('79ae2172-1e7b-4f2d-8466-9e8244098565', 'summit-partners-group', '2024-09-01', 13.0, 'manual_entry'),
  ('79ae2172-1e7b-4f2d-8466-9e8244098565', 'summit-partners-group', '2024-10-01', 14.2, 'manual_entry'),
  ('79ae2172-1e7b-4f2d-8466-9e8244098565', 'summit-partners-group', '2024-11-01', 15.0, 'manual_entry'),
  ('79ae2172-1e7b-4f2d-8466-9e8244098565', 'summit-partners-group', '2024-12-01', 16.2, 'manual_entry'),
  ('79ae2172-1e7b-4f2d-8466-9e8244098565', 'summit-partners-group', '2025-01-01', 17.5, 'manual_entry'),
  ('79ae2172-1e7b-4f2d-8466-9e8244098565', 'summit-partners-group', '2025-02-01', 18.5, 'manual_entry'),
  ('79ae2172-1e7b-4f2d-8466-9e8244098565', 'summit-partners-group', '2025-03-01', 19.8, 'manual_entry'),
  ('79ae2172-1e7b-4f2d-8466-9e8244098565', 'summit-partners-group', '2025-04-01', 20.8, 'manual_entry'),
  ('79ae2172-1e7b-4f2d-8466-9e8244098565', 'summit-partners-group', '2025-05-01', 22.0, 'manual_entry'),
  ('79ae2172-1e7b-4f2d-8466-9e8244098565', 'summit-partners-group', '2025-06-01', 23.0, 'manual_entry'),
  ('79ae2172-1e7b-4f2d-8466-9e8244098565', 'summit-partners-group', '2025-07-01', 24.2, 'manual_entry'),
  -- New Client Pipeline
  ('aec03127-a31f-41de-a816-fb061f5ecedc', 'summit-partners-group', '2024-08-01', 15, 'manual_entry'),
  ('aec03127-a31f-41de-a816-fb061f5ecedc', 'summit-partners-group', '2024-09-01', 17, 'manual_entry'),
  ('aec03127-a31f-41de-a816-fb061f5ecedc', 'summit-partners-group', '2024-10-01', 19, 'manual_entry'),
  ('aec03127-a31f-41de-a816-fb061f5ecedc', 'summit-partners-group', '2024-11-01', 21, 'manual_entry'),
  ('aec03127-a31f-41de-a816-fb061f5ecedc', 'summit-partners-group', '2024-12-01', 23, 'manual_entry'),
  ('aec03127-a31f-41de-a816-fb061f5ecedc', 'summit-partners-group', '2025-01-01', 25, 'manual_entry'),
  ('aec03127-a31f-41de-a816-fb061f5ecedc', 'summit-partners-group', '2025-02-01', 27, 'manual_entry'),
  ('aec03127-a31f-41de-a816-fb061f5ecedc', 'summit-partners-group', '2025-03-01', 29, 'manual_entry'),
  ('aec03127-a31f-41de-a816-fb061f5ecedc', 'summit-partners-group', '2025-04-01', 31, 'manual_entry'),
  ('aec03127-a31f-41de-a816-fb061f5ecedc', 'summit-partners-group', '2025-05-01', 33, 'manual_entry'),
  ('aec03127-a31f-41de-a816-fb061f5ecedc', 'summit-partners-group', '2025-06-01', 36, 'manual_entry'),
  ('aec03127-a31f-41de-a816-fb061f5ecedc', 'summit-partners-group', '2025-07-01', 38, 'manual_entry')
ON CONFLICT DO NOTHING;
