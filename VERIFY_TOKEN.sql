-- ============================================================================
-- 🔍 CHECK TOKEN VALIDITY
-- ============================================================================

-- Query 1: Current token info
SELECT 
    page_name,
    team_id,
    LENGTH(access_token) as token_length,
    SUBSTRING(access_token, 1, 30) || '...' as token_start,
    created_at,
    (NOW() - created_at) as age
FROM meta_pages;

-- Query 2: Test if we can see the token
SELECT 
    page_name,
    CASE 
        WHEN access_token IS NULL THEN '❌ NULL'
        WHEN LENGTH(access_token) = 0 THEN '❌ EMPTY'
        WHEN LENGTH(access_token) < 100 THEN '⚠️ TOO SHORT'
        ELSE '✅ LOOKS VALID'
    END as status
FROM meta_pages;
