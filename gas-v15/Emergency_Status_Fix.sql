-- ============================================================================
-- EMERGENCY STATUS FIX: MAKE LEADS DISTRIBUTABLE
-- ============================================================================

-- 1. Convert "Fresh" leads to "New" status (ONLY TODAY'S LEADS)
-- Targets leads since 12:00 PM IST (06:30 AM UTC)
UPDATE leads 
SET status = 'New' 
WHERE status = 'Fresh' 
  AND created_at >= '2026-01-09 06:30:00'::timestamptz;

-- 2. Clean phone number formats (ONLY TODAY'S LEADS)
-- Removes non-digits and takes last 10 digits to pass junk filter
UPDATE leads 
SET phone = RIGHT(REGEXP_REPLACE(phone, '\D', '', 'g'), 10)
WHERE status = 'New' 
  AND created_at >= '2026-01-09 06:30:00'::timestamptz
  AND LENGTH(REGEXP_REPLACE(phone, '\D', '', 'g')) >= 10;

-- 3. FINAL VERIFICATION
SELECT status, COUNT(*) FROM leads WHERE status IN ('New', 'Fresh') GROUP BY 1;
