
-- Raw SQL to unschedule the cron job
SELECT cron.unschedule('backlog-sweeper-10min');
