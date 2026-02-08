-- ============================================================================
-- 🔐 UPDATE RAJWINDER'S EXTENDED TOKEN - FEB 7
-- ============================================================================
-- Updates the token specifically for Rajwinder's pages.

UPDATE meta_pages 
SET access_token = 'EAAMp6Xu8vQ8BQlOJI0cZAQY08fIOPePT7hcwZBbOjHMNKlMct64yRZBFPtkk00NrNadZBFZAKJCPWMQ2wIQkMZBKyxHIY4IYlEKCoVd8g1BwsZCIjr4oLEOtCUpLKXgtLDrTdi61KgpIAHQSZB6Md6G9jAEHBJSbevmZB2oxwn0OAJnZApBK8PYlEIrI0MSJ3B'
WHERE page_name ILIKE '%Rajwinder%';

-- Verify update
SELECT page_name, LEFT(access_token, 20) || '...' as token_preview
FROM meta_pages 
WHERE page_name ILIKE '%Rajwinder%';
