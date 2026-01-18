-- ORPHAN LEADS ANALYSIS: Date breakdown + Root cause

-- 1. DATE-WISE BREAKDOWN of 897 Orphan Leads
SELECT 
    DATE(created_at) as Lead_Date,
    COUNT(*) as Orphan_Count,
    CASE 
        WHEN DATE(created_at) >= CURRENT_DATE - 2 THEN '✅ RECENT - Can Assign'
        WHEN DATE(created_at) >= CURRENT_DATE - 7 THEN '⚠️ WEEK OLD'
        ELSE '❌ OLD - Can Delete'
    END as Action
FROM leads 
WHERE status = 'Assigned' AND assigned_to IS NULL
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC;

-- 2. SOURCE-WISE BREAKDOWN (Which source is causing orphans?)
SELECT 
    source,
    COUNT(*) as Orphan_Count
FROM leads 
WHERE status = 'Assigned' AND assigned_to IS NULL
GROUP BY source
ORDER BY COUNT(*) DESC
LIMIT 10;

-- 3. ROOT CAUSE ANALYSIS - Check if these leads have user_id but no assigned_to
SELECT 
    'Has user_id but no assigned_to' as Issue,
    COUNT(*) as Count
FROM leads 
WHERE status = 'Assigned' 
AND assigned_to IS NULL 
AND user_id IS NOT NULL

UNION ALL

SELECT 
    'Both user_id and assigned_to are NULL' as Issue,
    COUNT(*) as Count
FROM leads 
WHERE status = 'Assigned' 
AND assigned_to IS NULL 
AND user_id IS NULL;

-- 4. Check if any common time pattern (Night leads?)
SELECT 
    EXTRACT(HOUR FROM created_at AT TIME ZONE 'Asia/Kolkata') as Hour_IST,
    COUNT(*) as Orphan_Count
FROM leads 
WHERE status = 'Assigned' AND assigned_to IS NULL
GROUP BY EXTRACT(HOUR FROM created_at AT TIME ZONE 'Asia/Kolkata')
ORDER BY Orphan_Count DESC
LIMIT 10;
