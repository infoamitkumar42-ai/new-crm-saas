
-- 1. RESET ALL ACTIVE USERS TO 0
UPDATE users 
SET leads_today = 0,
    updated_at = NOW()
WHERE is_active = true;

-- 2. RECYCLE ALL LEADS FROM TODAY (Make them 'New' again)
UPDATE leads
SET status = 'New',
    user_id = NULL,
    assigned_to = NULL,
    assigned_at = NULL
WHERE created_at > CURRENT_DATE
  AND status != 'Invalid' -- Don't recycle Invalid/Test leads
  AND status != 'Test';

-- 3. VERIFY
SELECT count(*) as active_users_reset FROM users WHERE leads_today = 0 AND is_active = true;
SELECT count(*) as leads_ready_in_queue FROM leads WHERE status = 'New' AND created_at > CURRENT_DATE;
