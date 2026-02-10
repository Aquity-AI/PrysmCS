/*
  # Re-seed Demo Historical Data with NOW()-Relative Dates

  Replaces fixed-date historical data for 3 demo clients with data anchored to NOW().
  Charts always display data regardless of when the demo is accessed.

  1. Deletes existing historical_metric_data for demo clients
  2. Re-inserts 12 months per metric using date_trunc('month', NOW()) offsets
  3. Client narratives:
     - Apex Solutions: mature high-performer, strong upward trends
     - Cascade Enterprises: steady mid-tier, moderate growth
     - Summit Partners: fast-growing newcomer, steep trajectories
  4. 20 metrics per client, 60 total metric series, 720 data points
*/

DELETE FROM historical_metric_data
WHERE client_id IN ('apex-solutions', 'cascade-enterprises', 'summit-partners-group');

INSERT INTO historical_metric_data (metric_id, client_id, data_date, value, data_source)
SELECT
  m.id::uuid,
  m.cid,
  date_trunc('month', NOW()) - ((11 - g.i) * interval '1 month'),
  m.vals[g.i + 1],
  'manual_entry'
FROM (VALUES
  ('eb9b75fb-0622-447a-ab01-9df690a27a56','apex-solutions',ARRAY[180000,185800,191200,195500,201200,208500,215200,222800,231400,238600,243200,245100]::numeric[]),
  ('d94cb89c-c924-47a1-a233-a6cbd71eb6de','apex-solutions',ARRAY[780,805,835,858,872,892,918,945,963,989,1002,1012]::numeric[]),
  ('41990475-2724-4d8c-b25c-9ae24f2e4f0a','apex-solutions',ARRAY[5.2,5.5,5.8,5.4,6.1,6.4,6.8,7.0,7.3,7.6,7.9,8.1]::numeric[]),
  ('18cf92f4-6185-4020-a8f5-b0e9519621e7','apex-solutions',ARRAY[89.2,89.8,90.1,90.5,91.0,91.4,91.8,92.3,92.7,93.1,93.5,94.0]::numeric[]),
  ('7f5ce8f0-c785-48ae-8ce9-f702cf75584c','apex-solutions',ARRAY[118500,120200,121800,123500,126200,128000,129500,131200,133800,135500,137200,139800]::numeric[]),
  ('e0b619d0-2717-407e-a121-d347503d6568','apex-solutions',ARRAY[38.2,38.8,39.5,39.1,40.2,41.0,41.8,42.5,43.2,44.1,45.0,45.8]::numeric[]),
  ('6c30d2d6-5cd3-41ed-9704-b0d235a6b32b','apex-solutions',ARRAY[452,458,465,471,478,485,490,497,503,508,514,521]::numeric[]),
  ('2f8b6f46-a7e5-4762-a857-472adac42a7b','apex-solutions',ARRAY[852,838,825,818,805,790,778,765,752,740,728,718]::numeric[]),
  ('25974964-28f2-4b40-86fc-2aaa318699a3','apex-solutions',ARRAY[88.1,88.5,89.2,89.8,90.3,90.8,91.4,91.9,92.5,93.0,93.5,94.1]::numeric[]),
  ('425310da-42d8-432c-84bd-2f8f543516ce','apex-solutions',ARRAY[7.8,7.5,7.2,7.0,6.8,6.5,6.2,6.0,5.7,5.5,5.2,5.0]::numeric[]),
  ('065dce37-016b-4211-8103-cc6271846cd9','apex-solutions',ARRAY[82.3,83.1,84.0,84.5,85.2,86.0,86.8,87.5,88.2,89.0,90.1,91.2]::numeric[]),
  ('326537e5-e89a-4606-829a-1e2090c6123e','apex-solutions',ARRAY[72,73,74,73,75,76,77,78,79,80,81,82]::numeric[]),
  ('14ca5c84-5b19-49ea-b8a4-7a4d006521c4','apex-solutions',ARRAY[4.2,4.0,3.8,3.6,3.4,3.2,3.0,2.8,2.6,2.4,2.2,2.1]::numeric[]),
  ('4389c2f3-54f3-480d-9b64-094ede239102','apex-solutions',ARRAY[145,138,132,128,122,118,115,110,108,104,100,98]::numeric[]),
  ('39215f6e-80e3-4553-97b1-ae468fcda469','apex-solutions',ARRAY[78.2,79.1,80.0,80.8,81.5,82.3,83.0,84.1,85.0,86.2,87.0,88.1]::numeric[]),
  ('57aa989f-50da-4500-ac9d-0b48a402300b','apex-solutions',ARRAY[42.5,43.0,43.5,44.0,44.2,44.8,45.2,45.8,46.3,46.8,47.2,47.8]::numeric[]),
  ('abf27910-1597-44c8-a660-d237d71f129c','apex-solutions',ARRAY[22.1,23.0,24.2,24.8,25.5,26.3,27.1,28.0,29.2,30.1,31.0,32.2]::numeric[]),
  ('65c955e0-363c-47a7-8ddf-68b0b8e977e2','apex-solutions',ARRAY[34,36,38,37,40,42,43,45,47,48,50,52]::numeric[]),
  ('4c352d32-edb6-44d4-aad9-d78aa9d66aa2','apex-solutions',ARRAY[28,30,32,31,34,36,38,40,42,44,46,48]::numeric[]),
  ('db2ea7bf-53a7-4428-9c73-261db8723b26','apex-solutions',ARRAY[340,355,370,382,398,415,432,448,465,482,500,520]::numeric[]),
  ('1eb84687-0ce1-4d8b-bd59-526f88ce40ab','cascade-enterprises',ARRAY[120000,122500,124800,126200,127500,130200,133500,136800,140100,143500,145800,147800]::numeric[]),
  ('23fe89ca-525d-4f3c-a708-343e0d2ca979','cascade-enterprises',ARRAY[520,535,548,560,575,590,610,635,658,680,698,712]::numeric[]),
  ('37fd266d-c392-4eb6-bed6-8a4af1b8370b','cascade-enterprises',ARRAY[3.1,3.4,3.6,3.3,3.8,4.1,4.4,4.6,4.9,5.2,5.5,5.8]::numeric[]),
  ('34469e7d-1bc4-4b54-8cb6-3b3bcd107c6f','cascade-enterprises',ARRAY[84.0,84.3,84.8,85.2,85.5,86.0,86.4,86.8,87.2,87.8,88.2,88.8]::numeric[]),
  ('52f919d8-9493-498a-be77-4fef5cc03e3b','cascade-enterprises',ARRAY[85200,86100,87300,88500,89800,90500,91800,92600,93800,95200,96500,97800]::numeric[]),
  ('35c09368-1401-4bf2-b704-285d9d9b4d79','cascade-enterprises',ARRAY[32.0,32.5,33.0,32.8,33.5,34.0,34.8,35.2,35.8,36.5,37.2,38.0]::numeric[]),
  ('b3c0d4a9-d7b7-45b9-b267-740ab239c184','cascade-enterprises',ARRAY[320,325,330,335,340,345,350,358,362,370,375,380]::numeric[]),
  ('7e8db553-583a-4a23-b4c6-524f5519dc37','cascade-enterprises',ARRAY[980,968,955,948,935,920,908,895,880,868,855,845]::numeric[]),
  ('16c0d4c8-3995-4ac7-b448-b674e63dce5c','cascade-enterprises',ARRAY[80.0,80.5,81.2,81.8,82.5,83.0,83.8,84.5,85.2,85.8,86.5,87.0]::numeric[]),
  ('cfedc143-5f3e-4b56-b60f-267610d291f4','cascade-enterprises',ARRAY[11.0,10.8,10.5,10.2,10.0,9.6,9.3,9.0,8.6,8.4,8.2,8.0]::numeric[]),
  ('40a29df5-d620-447e-afe5-034b04dd85c8','cascade-enterprises',ARRAY[72.0,73.0,74.0,74.5,75.2,76.0,77.0,78.0,79.0,80.0,81.0,82.0]::numeric[]),
  ('9f67b5cd-6395-4876-910d-53666b312a4a','cascade-enterprises',ARRAY[58,59,60,59,61,62,63,64,65,66,67,68]::numeric[]),
  ('10df8f2a-354c-470a-b470-e73623a132f3','cascade-enterprises',ARRAY[6.5,6.3,6.0,5.8,5.5,5.3,5.0,4.8,4.6,4.5,4.3,4.2]::numeric[]),
  ('21334239-fc4c-4a34-b0f7-ac26433224a0','cascade-enterprises',ARRAY[180,175,170,165,162,158,155,150,145,142,138,135]::numeric[]),
  ('0bbf047b-316b-499b-8694-7ba776b03cc2','cascade-enterprises',ARRAY[72.0,72.8,73.5,74.0,74.8,75.5,76.2,77.0,78.0,78.8,79.5,80.0]::numeric[]),
  ('f86f2805-5a02-47bc-89de-1f31830bcce1','cascade-enterprises',ARRAY[35.0,35.4,35.8,36.2,36.5,37.0,37.5,38.0,38.5,39.0,39.5,40.0]::numeric[]),
  ('7c7086e7-6080-4b1f-b7cd-e76a8a054c95','cascade-enterprises',ARRAY[15.0,15.5,16.2,16.8,17.5,18.0,18.8,19.5,20.0,20.8,21.5,22.0]::numeric[]),
  ('5ea0bcd5-0995-4f5f-aa43-c3ca6d1ea0bf','cascade-enterprises',ARRAY[22,23,24,23,25,26,28,29,31,32,34,35]::numeric[]),
  ('186876b4-3bc6-4bcd-837b-b95bced93b7a','cascade-enterprises',ARRAY[18,19,20,20,22,23,25,27,28,30,32,35]::numeric[]),
  ('d34a6c6e-8805-46dc-bea7-d957086f07af','cascade-enterprises',ARRAY[210,218,225,232,240,250,260,272,288,305,322,340]::numeric[]),
  ('afb9eb99-e724-442b-948a-4b619cbe53ab','summit-partners-group',ARRAY[65000,68500,72200,76800,78500,82500,88200,94800,101500,108200,112000,115000]::numeric[]),
  ('8a927d0d-7700-4ad7-a067-34ddecd9a0b9','summit-partners-group',ARRAY[220,240,258,278,295,318,345,372,398,425,452,480]::numeric[]),
  ('cae9adc8-f821-45c6-992b-88a07668645e','summit-partners-group',ARRAY[8.5,9.0,9.5,9.2,10.1,10.8,11.2,11.8,12.5,13.0,13.5,14.2]::numeric[]),
  ('392b2d37-165b-4eab-b3a7-06f4af36e99d','summit-partners-group',ARRAY[78.0,78.8,79.5,80.2,81.0,81.8,82.5,83.2,84.0,84.8,85.5,86.5]::numeric[]),
  ('0d0ea7df-fd23-4433-b468-d94c90ea1422','summit-partners-group',ARRAY[52000,54200,56800,59500,62000,65000,68200,71500,74800,78000,80500,82000]::numeric[]),
  ('236dbc9e-9b33-47c2-ab65-fd57bd486666','summit-partners-group',ARRAY[28.0,28.5,29.0,29.2,29.8,30.5,31.0,31.8,32.5,33.2,34.0,35.0]::numeric[]),
  ('9a8ba2dd-b5b3-40f9-aafb-9dbe33bc44d0','summit-partners-group',ARRAY[280,285,290,295,300,305,312,318,325,330,335,340]::numeric[]),
  ('46cef6b3-c78a-49b5-beb5-14018786d073','summit-partners-group',ARRAY[1100,1080,1055,1035,1010,990,970,950,930,915,900,890]::numeric[]),
  ('4fd08c7e-9dad-4563-b189-b5c3ce13bf1a','summit-partners-group',ARRAY[74.0,74.8,75.5,76.2,77.0,78.0,79.0,80.0,81.0,82.0,83.0,84.0]::numeric[]),
  ('b659b3f5-6070-4f65-be17-980331398526','summit-partners-group',ARRAY[14.0,13.5,13.0,12.5,12.0,11.5,11.0,10.5,10.0,9.8,9.5,9.0]::numeric[]),
  ('58a2459c-4c12-42e0-87d2-2f3575a6297e','summit-partners-group',ARRAY[68.0,69.0,70.0,71.0,72.0,73.5,74.5,76.0,77.0,78.0,79.0,80.0]::numeric[]),
  ('1a348355-cbda-45ed-8191-34653e5d964c','summit-partners-group',ARRAY[48,49,50,50,52,53,55,56,58,59,61,62]::numeric[]),
  ('0fdb75cc-b393-4f5d-ae2f-4343ec0d9876','summit-partners-group',ARRAY[8.0,7.8,7.5,7.2,7.0,6.8,6.5,6.2,5.8,5.5,5.2,5.0]::numeric[]),
  ('5d305a13-a23d-4af9-ae70-d8dfcff1721f','summit-partners-group',ARRAY[210,205,198,192,188,182,178,172,168,165,160,155]::numeric[]),
  ('c97af57a-9a7a-4f52-af76-ecfa21683dca','summit-partners-group',ARRAY[65.0,66.0,67.0,68.0,69.0,70.5,72.0,73.0,74.5,76.0,77.0,78.0]::numeric[]),
  ('cefe9e80-1a92-4766-95f4-dfe0fb2f06a4','summit-partners-group',ARRAY[30.0,30.5,31.0,31.8,32.5,33.0,34.0,35.0,36.0,36.8,37.5,38.0]::numeric[]),
  ('79ae2172-1e7b-4f2d-8466-9e8244098565','summit-partners-group',ARRAY[10.0,10.5,11.2,11.8,12.5,13.0,14.0,14.8,15.5,16.2,17.0,18.0]::numeric[]),
  ('aec03127-a31f-41de-a816-fb061f5ecedc','summit-partners-group',ARRAY[15,16,17,18,20,22,24,25,27,28,30,32]::numeric[]),
  ('8e8e37d1-b52b-4ae7-a9bc-9684813acc75','summit-partners-group',ARRAY[12,15,18,22,25,30,35,38,42,48,52,56]::numeric[]),
  ('2710e3c7-ef3d-4391-80ca-311e8bd4fd4c','summit-partners-group',ARRAY[140,158,178,200,225,255,285,310,338,365,392,420]::numeric[])
) AS m(id, cid, vals)
CROSS JOIN generate_series(0, 11) AS g(i);
