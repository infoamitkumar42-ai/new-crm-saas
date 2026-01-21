
-- Enable pg_cron (if not already)
create extension if not exists pg_cron;

-- 1. Unschedule old jobs safely (Only if they exist)
-- This query finds the job ID by name and then unschedules it.
-- If no job matches, it does nothing (no error).

SELECT cron.unschedule(jobid) 
FROM cron.job 
WHERE jobname = 'morning-backlog-distribution';

SELECT cron.unschedule(jobid) 
FROM cron.job 
WHERE jobname = 'backlog-sweeper-10min';

SELECT cron.unschedule(jobid) 
FROM cron.job 
WHERE jobname = 'backlog-sweeper-fast';

-- 2. Schedule FAST "Safety Net" Job (Every 1 Minute)
-- Syntax: min hour day month day_of_week
-- * * * * * = Every Minute
select cron.schedule(
  'backlog-sweeper-fast',
  '* * * * *', 
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
