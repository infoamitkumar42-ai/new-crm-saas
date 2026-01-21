
-- 🚨 EMERGENCY STOP: UNSCHEDULE ALL CRON JOBS
SELECT cron.unschedule(jobid) 
FROM cron.job 
WHERE jobname IN ('backlog-sweeper-fast', 'backlog-sweeper-10min', 'morning-backlog-distribution');

-- Verify they are gone
SELECT * FROM cron.job;
