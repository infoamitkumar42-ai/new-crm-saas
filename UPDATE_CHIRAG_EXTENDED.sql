-- ============================================================================
-- 🔐 UPDATE CHIRAG'S EXTENDED TOKEN - FEB 7
-- ============================================================================
-- Updates the token specifically for Chirag's pages (Digital Chirag, New CBO, Bhumit).

UPDATE meta_pages 
SET access_token = 'EAAMp6Xu8vQ8BQua9pK6yHtAtmktSlurTazhqE73ZCrTM2J3nV4NFMoE7JRZAhCLTpZAQnGqar8tCXsw2JJ6OZC2ETPZCUE5Ae1Y7ETmoXJ3TiEZC0MfnvZAFBDRSKIMdZCtN0K5KtrXwh7WZA7LX5irvh04ydNZCVAbNwwKCZC4lLqaEDGIqf3QZCpfPEqyOB3ZBb'
WHERE page_name ILIKE '%Chirag%' OR page_name ILIKE '%New CBO%' OR page_name ILIKE '%Bhumit%';

-- Verify update
SELECT page_name, LEFT(access_token, 20) || '...' as token_preview
FROM meta_pages 
WHERE page_name ILIKE ANY(ARRAY['%Chirag%', '%New CBO%', '%Bhumit%']);
