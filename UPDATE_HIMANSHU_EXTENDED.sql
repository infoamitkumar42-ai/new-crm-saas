-- ============================================================================
-- 🔐 UPDATE HIMANSHU'S EXTENDED TOKEN - FEB 7
-- ============================================================================
-- Updates the token specifically for "Work With Himanshu Sharma" pages.

UPDATE meta_pages 
SET access_token = 'EAAMp6Xu8vQ8BQkh4kdwp5ZBe5lVjAByaNUZBSefmqFGZBSzZB9aR9OKyRF9gRFOMtppGVL3JTA9YZCMBJVyMwfCJ7OsCI7echO13H0iFqFYXHIPWoWj4ghCtazlSmeeDZAPGHVpa6FF7VYwrCl9SBqdpfULbU91BtWw9HWC7GsZBkDnmZCfbFz4Lki003AXn8BGn'
WHERE page_name ILIKE '%Himanshu%';

-- Verify update
SELECT page_name, LEFT(access_token, 20) || '...' as token_preview
FROM meta_pages 
WHERE page_name ILIKE '%Himanshu%';
