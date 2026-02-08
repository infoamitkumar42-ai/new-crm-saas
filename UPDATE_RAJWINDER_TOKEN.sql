-- ============================================================================
-- 🔑 UPDATE ACCESS TOKEN - Rajwinder's Pages
-- ============================================================================

-- Update all Rajwinder pages with fresh token
UPDATE meta_pages
SET access_token = 'EAAMp6Xu8vQ8BQhewzPc4qnVUq3lPrZBcZCUZBcWeFYf0Ie9V2OlWjbiwmqhtbkG0nBO7rs73rmQMmZAXbT05kienvpmOg9ha9ZC573auG3l4Jr64HgSnas83C81AeZAZBk1zv5eMIQ6npZAWwaEBwtCgGb00G3rAruyxw7vlpxaK3xnZBBPFZCCZBlc09RvtaAvUKRLUrSz7gKyDQdY1YnlT3rg8ZBaoG7ZADA3JCZCxKFYHWUA0CUM5QUgniZAJzTSpFP9NMCHlT2Y1RBMqRriKEYZD'
WHERE team_id = 'TEAMRAJ';

-- Verify update
SELECT 
    page_name,
    team_id,
    SUBSTRING(access_token, 1, 30) || '...' as token_preview,
    LENGTH(access_token) as token_length
FROM meta_pages
WHERE team_id = 'TEAMRAJ'
ORDER BY page_name;

-- ============================================================================
-- FINAL TOKEN STATUS - ALL TEAMS
-- ============================================================================
SELECT 
    CASE 
        WHEN team_id = 'TEAMFIRE' THEN 'Himanshu Sharma'
        WHEN team_id = 'GJ01TEAMFIRE' THEN 'Digital Chirag'
        WHEN team_id = 'TEAMRAJ' THEN 'Rajwinder Singh'
        ELSE team_id
    END as team,
    page_name,
    CASE 
        WHEN access_token IS NULL THEN '❌ NO TOKEN'
        WHEN LENGTH(access_token) > 200 THEN '✅ HAS TOKEN'
        ELSE '⚠️ SHORT'
    END as status,
    LENGTH(access_token) as length
FROM meta_pages
ORDER BY team, page_name;
