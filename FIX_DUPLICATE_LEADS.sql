
-- ============================================================================
-- 🧹 REMOVE DUPLICATE LEADS (Keep Oldest)
-- ============================================================================
-- Objective: Find leads with EXACT same phone number and keep only the OLDEST one.
-- This ensures that original owners retain the lead, and newer duplicates are removed.

BEGIN;

-- Create a temporary table to identify duplicates to delete
CREATE TEMP TABLE leads_to_delete AS
SELECT id
FROM (
    SELECT 
        id,
        phone,
        ROW_NUMBER() OVER (
            PARTITION BY phone 
            ORDER BY created_at ASC -- Keep the Oldest (First created)
        ) as rn
    FROM leads
    WHERE phone IS NOT NULL AND phone != ''
) t
WHERE rn > 1;

-- Log the count (Optional, but good for debugging if run manually)
-- DELETE the identified leads
DELETE FROM leads
WHERE id IN (SELECT id FROM leads_to_delete);

COMMIT;

-- Verify
-- SELECT count(*) FROM leads;
