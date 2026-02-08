
-- ============================================================================
-- 🧹 REMOVE DUPLICATE LEADS (SMART MODE)
-- ============================================================================
-- Objective: Remove duplicates but KEEP the most 'Active/Valuable' row.
-- Priority:
-- 1. Leads with Replacement Requests (User engaged, flagged)
-- 2. Leads with Notes (User engaged)
-- 3. Oldest Created (Default tie-breaker)

BEGIN;

-- 1. Identify which Leads to DELETE
-- Rank 1 = Winner (Keep). Rank > 1 = Loser (Delete).
CREATE TEMP TABLE leads_to_delete_smart AS
SELECT id
FROM (
    SELECT 
        l.id,
        l.phone,
        ROW_NUMBER() OVER (
            PARTITION BY l.phone 
            ORDER BY 
                -- Priority 1: Has Replacement Request (Boolean -> DESC)
                (EXISTS (SELECT 1 FROM lead_replacements lr WHERE lr.original_lead_id = l.id))::int DESC,
                
                -- Priority 2: Has Notes (Length > 0 -> DESC)
                (CASE WHEN l.notes IS NOT NULL AND length(l.notes) > 0 THEN 1 ELSE 0 END) DESC,
                
                -- Priority 3: Oldest First (Catch-all)
                l.created_at ASC
        ) as rn
    FROM leads l
    WHERE l.phone IS NOT NULL AND l.phone != ''
) t
WHERE rn > 1;

-- 2. Clean up Child Records for the LOSERS (so we can delete them)
-- If a 'Loser' lead has a replacement request (unlikely due to sorting, but possible if both duplicates have requests),
-- we delete the request associated with the loser.
DELETE FROM lead_replacements
WHERE original_lead_id IN (SELECT id FROM leads_to_delete_smart);

-- 3. Delete the Duplicate Leads (Losers)
DELETE FROM leads
WHERE id IN (SELECT id FROM leads_to_delete_smart);

COMMIT;

-- Verify
-- SELECT count(*) FROM leads;
