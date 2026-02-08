-- ============================================================================
-- 🕵️ SEARCH FOR USERS WITH SIMILAR EMAILS
-- ============================================================================

SELECT id, email, name 
FROM users 
WHERE email ILIKE 'mandeep%' 
   OR name ILIKE '%mandeep%';
