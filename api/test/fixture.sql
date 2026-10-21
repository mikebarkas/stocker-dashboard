-- Small, fixed data set for the API tests. Times are UTC.
-- MSFT has rows on both sides of each day boundary to test date ranges.
insert into stocker.quotes (symbol, price, change, ts) values
  ('MSFT', 409.00,  -1.00, '2026-10-19T23:59:59.999Z'), -- last instant of the 19th
  ('MSFT', 410.00,   1.00, '2026-10-20T00:00:00Z'),     -- first instant of the 20th
  ('MSFT', 415.50,   6.50, '2026-10-20T14:00:00Z'),     -- all-time high
  ('MSFT', 411.25,   2.25, '2026-10-20T23:59:59.999Z'), -- last instant of the 20th
  ('MSFT', 405.10,  -6.15, '2026-10-21T00:00:00Z'),
  ('MSFT', 400.00, -11.25, '2026-10-21T14:00:00Z'),     -- all-time low
  ('MSFT', 402.75,  -8.50, '2026-10-21T20:00:00Z'),     -- latest
  ('NVDA', 180.00,   1.00, '2026-10-20T14:00:00Z'),
  ('NVDA', 181.50,   2.50, '2026-10-20T15:00:00Z'),
  ('NVDA', 179.25,   0.25, '2026-10-20T16:00:00Z'),
  ('BRK.B', 480.10,  0.40, '2026-10-21T15:00:00Z');
