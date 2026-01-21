
-- Enable pg_cron (if not already)
create extension if not exists pg_cron;

-- 1. Unschedule old jobs to avoid conflicts
select cron.unschedule('morning-backlog-distribution');
select cron.unschedule('backlog-sweeper-10min');

-- 2. Schedule New "Safety Net" Job (Every 10 Minutes)
-- Syntax: min hour day month day_of_week
-- */10 * * * * = Every 10th minute
select cron.schedule(
  'backlog-sweeper-10min',
  '*/10 * * * *', 
  $$
    select
      net.http_post(
          url:='https://vewqzsqddgmkslnuctvb.supabase.co/functions/v1/process-backlog',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us"}'::jsonb,
          body:='{}'::jsonb
      ) as request_id;
  $$
);

-- 3. Verify
select * from cron.job;
