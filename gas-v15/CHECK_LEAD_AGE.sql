-- CHECK: How old are the leads that were just fixed?
-- We need to see date-wise breakdown

-- 1. Date-wise count of ALL assigned leads (recently fixed ones included)
SELECT 
    DATE(created_at) as Lead_Date,
    COUNT(*) as Lead_Count,
    CASE 
        WHEN DATE(created_at) >= '2026-01-15' THEN '✅ RECENT (14-17 Jan) - KEEP'
        WHEN DATE(created_at) >= '2026-01-10' THEN '⚠️ 1 WEEK OLD (10-14 Jan)'
        ELSE '❌ TOO OLD - Consider removing'
    END as Recommendation
FROM leads 
WHERE status = 'Assigned'
AND assigned_to IS NOT NULL
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC;

-- 2. Count by age category
SELECT 
    CASE 
        WHEN DATE(created_at) >= '2026-01-15' THEN 'Recent (15-17 Jan)'
        WHEN DATE(created_at) >= '2026-01-10' THEN 'Week Old (10-14 Jan)'
        ELSE 'Very Old (Before 10 Jan)'
    END as Age_Category,
    COUNT(*) as Lead_Count
FROM leads 
WHERE status = 'Assigned'
AND assigned_to IS NOT NULL
GROUP BY 
    CASE 
        WHEN DATE(created_at) >= '2026-01-15' THEN 'Recent (15-17 Jan)'
        WHEN DATE(created_at) >= '2026-01-10' THEN 'Week Old (10-14 Jan)'
        ELSE 'Very Old (Before 10 Jan)'
    END
ORDER BY Lead_Count DESC;
