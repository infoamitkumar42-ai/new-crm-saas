
-- 🚨 EMERGENCY FIX & RESET SCRIPT 🚨

-- 1. DESTROY THE BLOCKING TRIGGER (Root Cause of 'Ghost Assignments')
-- This trigger was forcing leads back to 'New' while Counters went up.
DROP TRIGGER IF EXISTS stop_leads_trigger ON leads;
DROP FUNCTION IF EXISTS force_stop_assignments;

-- 2. RESET ALL USER COUNTERS TO 0
-- Wipes the fake "14/14" numbers.
UPDATE users 
SET leads_today = 0,
    updated_at = NOW()
WHERE is_active = true;

-- 3. RESET TODAY'S LEADS TO 'NEW'
-- Ensures all 80+ leads are ready for fresh distribution.
UPDATE leads
SET status = 'New',
    user_id = NULL,
    assigned_to = NULL,
    assigned_at = NULL
WHERE created_at > CURRENT_DATE;

-- 4. VERIFY CLEAN STATE
SELECT 'Trigger Dropped. Users=0. Leads=New.' as status_report;
SELECT count(*) as active_counters_zero FROM users WHERE leads_today = 0 AND is_active = true;
SELECT count(*) as leads_pending FROM leads WHERE status = 'New' AND created_at > CURRENT_DATE;
