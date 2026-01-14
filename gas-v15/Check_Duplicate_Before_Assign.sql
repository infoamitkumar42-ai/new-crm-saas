-- =====================================================
-- CHECK: Are any of these New leads already sent to active users?
-- Date: 2026-01-14
-- =====================================================

-- Check if any phone from New leads exists in Assigned leads
SELECT 
    'DUPLICATE FOUND' as status,
    new_lead.id as new_lead_id,
    new_lead.name as new_lead_name,
    new_lead.phone,
    existing.id as existing_lead_id,
    existing.status as existing_status,
    u.name as already_assigned_to
FROM leads new_lead
JOIN leads existing ON new_lead.phone = existing.phone 
    AND existing.id != new_lead.id
    AND existing.status = 'Assigned'
LEFT JOIN users u ON existing.user_id = u.id
WHERE new_lead.created_at >= CURRENT_DATE
  AND new_lead.status = 'New'
  AND new_lead.user_id IS NULL;

-- Summary: How many are safe vs duplicates
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM leads existing 
            WHERE existing.phone = new_lead.phone 
              AND existing.id != new_lead.id
              AND existing.status = 'Assigned'
        ) THEN '⚠️ DUPLICATE - Skip'
        ELSE '✅ SAFE - Can Assign'
    END as status,
    COUNT(*) as lead_count
FROM leads new_lead
WHERE new_lead.created_at >= CURRENT_DATE
  AND new_lead.status = 'New'
  AND new_lead.user_id IS NULL
GROUP BY 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM leads existing 
            WHERE existing.phone = new_lead.phone 
              AND existing.id != new_lead.id
              AND existing.status = 'Assigned'
        ) THEN '⚠️ DUPLICATE - Skip'
        ELSE '✅ SAFE - Can Assign'
    END;
