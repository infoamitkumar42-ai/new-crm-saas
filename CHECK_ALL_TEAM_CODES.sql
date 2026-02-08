-- ============================================================================
-- 🔍 CHECK ALL TEAM CODES - Find Missing Teams
-- ============================================================================

-- Query 1: List ALL unique team codes in database
SELECT 
    team_code,
    COUNT(*) as total_users,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_users
FROM users
GROUP BY team_code
ORDER BY total_users DESC;

-- Query 2: Check if there are other codes related to each manager
SELECT 
    team_code,
    COUNT(*) as users
FROM users
WHERE team_code LIKE '%FIRE%' 
   OR team_code LIKE '%RAJ%'
   OR team_code LIKE '%HIMANSHU%'
   OR team_code LIKE '%CHIRAG%'
   OR team_code LIKE 'GJ%'
GROUP BY team_code
ORDER BY users DESC;

-- Query 3: Broader check - all teams with significant members
SELECT 
    team_code,
    COUNT(*) as total,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active
FROM users
WHERE team_code IS NOT NULL
GROUP BY team_code
HAVING COUNT(*) >= 5
ORDER BY total DESC;
