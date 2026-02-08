-- ========================================================================
-- 🔍 CHECK IF PROFILES ARE LOADING PROPERLY FOR CHIRAG TEAM
-- ========================================================================

-- Check if any users have issues with their profile data
SELECT 
    id,
    name,
    email,
    role,
    is_active,
    team_code,
    CASE 
        WHEN email IS NULL THEN 'Missing Email'
        WHEN name IS NULL OR name = '' THEN 'Missing Name'
        WHEN role IS NULL THEN 'Missing Role'
        WHEN team_code IS NULL THEN 'Missing Team'
        ELSE 'OK'
    END as profile_status
FROM users 
WHERE team_code = 'GJ01TEAMFIRE'
  AND (
    email IS NULL 
    OR name IS NULL 
    OR name = ''
    OR role IS NULL
  );

-- Check total count
SELECT COUNT(*) as total_users
FROM users 
WHERE team_code = 'GJ01TEAMFIRE';
