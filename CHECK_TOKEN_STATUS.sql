-- ============================================================================
-- ⚡ CHECK ACCESS TOKEN STATUS
-- ============================================================================

-- Query 1: Check all Meta pages token status
SELECT 
    page_name,
    team_id,
    CASE 
        WHEN access_token IS NULL THEN '❌ NO TOKEN'
        WHEN LENGTH(access_token) < 50 THEN '⚠️ INVALID TOKEN'
        ELSE '✅ TOKEN EXISTS'
    END as token_status,
    is_active,
    created_at,
    updated_at
FROM meta_pages
ORDER BY page_name;

-- Query 2: Count pages by token status
SELECT 
    CASE 
        WHEN access_token IS NULL THEN 'No Token'
        WHEN LENGTH(access_token) < 50 THEN 'Invalid Token'
        ELSE 'Has Token'
    END as status,
    COUNT(*) as pages
FROM meta_pages
GROUP BY 
    CASE 
        WHEN access_token IS NULL THEN 'No Token'
        WHEN LENGTH(access_token) < 50 THEN 'Invalid Token'
        ELSE 'Has Token'
    END;

-- Query 3: Pages with tokens and their teams
SELECT 
    page_name,
    team_id,
    is_active,
    SUBSTRING(access_token, 1, 20) || '...' as token_preview
FROM meta_pages
WHERE access_token IS NOT NULL
ORDER BY page_name;
