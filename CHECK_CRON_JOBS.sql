-- ============================================================================
-- 🕵️ CHECK SUPABASE CRON JOBS
-- ============================================================================
-- Checks if there are any scheduled tasks (like backlog processing) running.

SELECT 
    jobname,
    schedule,
    command,
    active
FROM cron.job;

-- Check execution status of cron jobs
SELECT 
    jobname,
    start_time,
    end_time,
    status,
    return_message
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
