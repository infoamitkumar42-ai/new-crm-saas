
-- ============================================================================
-- 🧹 REMOVE DUPLICATE LEADS (V2 - Handle Foreign Keys)
-- ============================================================================
-- Objective: Find leads with EXACT same phone number and keep only the OLDEST one.
-- Refinements: Handles foreign key constraint 'lead_replacements_original_lead_id_fkey'.

BEGIN;

-- 1. Identify Duplicate Leads to Delete
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

-- 2. Delete Dependencies from 'lead_replacements'
DELETE FROM lead_replacements
WHERE original_lead_id IN (SELECT id FROM leads_to_delete);

-- 3. Delete Duplicate Leads
DELETE FROM leads
WHERE id IN (SELECT id FROM leads_to_delete);

COMMIT;

-- Verify
-- SELECT count(*) FROM leads;
