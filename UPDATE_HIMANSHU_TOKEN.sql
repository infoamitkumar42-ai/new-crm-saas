-- ============================================================================
-- 🔑 UPDATE ACCESS TOKENS - Himanshu's Pages
-- ============================================================================

-- Update all Himanshu Sharma pages with fresh token
UPDATE meta_pages
SET access_token = 'EAAMp6Xu8vQ8BQrkww2KLnuuqtYZC7mZAZAIfbiSIPzMimAqujhAlpoDZBDql9hzlr1YF1ZBcYRZB6vXPrlTgcBc17cRJJEMMx1YlgyZCucJ49yBQYLJOf24ehWfsZBiRABZCpaQE8qOCcAD9FnH6C2ZCvAyJN7i4PjiDKiQ23OGRi1WDAO6E7hwNiR8j48ZBZB5zdeWPx7vsYiObaadg2oWcZAvZA44DGHxwKURRyCXUaJKGRQCeTqyEL2rIdFmwq5rnA1Ymdi32bF2PKMqnkZCbfkU'
WHERE team_id = 'TEAMFIRE';

-- Verify update for all Himanshu pages
SELECT 
    page_name,
    team_id,
    SUBSTRING(access_token, 1, 30) || '...' as token_preview,
    LENGTH(access_token) as token_length
FROM meta_pages
WHERE team_id = 'TEAMFIRE'
ORDER BY page_name;

-- ============================================================================
-- Summary of all token statuses
-- ============================================================================
SELECT 
    page_name,
    team_id,
    CASE 
        WHEN access_token IS NULL THEN '❌ NO TOKEN'
        WHEN LENGTH(access_token) > 200 THEN '✅ HAS TOKEN'
        ELSE '⚠️ SHORT TOKEN'
    END as status,
    LENGTH(access_token) as length
FROM meta_pages
ORDER BY team_id, page_name;
