-- ============================================================================
-- 🕵️ CHECK META PAGES TO MAP TOKENS
-- ============================================================================

SELECT 
    id,
    page_name,
    page_id,
    access_token_status,
    -- We'll use source or name keywords to identify owners
    CASE 
        WHEN page_name ILIKE '%Himanshu%' THEN 'Himanshu'
        WHEN page_name ILIKE '%Chirag%' OR page_name ILIKE '%New CBO%' THEN 'Chirag'
        WHEN page_name ILIKE '%Rajwinder%' THEN 'Rajwinder'
        ELSE 'Unknown'
    END as owner_guess
FROM meta_pages;
