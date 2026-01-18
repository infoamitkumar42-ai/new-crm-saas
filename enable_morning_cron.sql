-- Enable the pg_cron extension (Must be run by Superuser/Admin in Dashboard SQL Editor)
create extension if not exists pg_cron;

-- Schedule the job to run every day at 10:00 AM IST
-- IST is UTC+5:30.
-- So 10:00 AM IST = 04:30 AM UTC.
-- Cron format: min hour day month day_of_week
-- 30 4 * * *

select cron.unschedule('morning-backlog-distribution');

select cron.schedule(
  'morning-backlog-distribution',
  '30 4 * * *', 
  $$
    select
      net.http_post(
          url:='https://vewqzsqddgmkslnuctvb.supabase.co/functions/v1/process-backlog',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us"}'::jsonb,
          body:='{}'::jsonb
      ) as request_id;
  $$
);

-- Check scheduled jobs
select * from cron.job;
