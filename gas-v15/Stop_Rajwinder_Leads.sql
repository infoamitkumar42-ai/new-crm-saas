-- EMERGENCY STOP: Deactivate Rajwinder's Page
-- This will prevent the webhook from processing any new leads from this page.

UPDATE connected_pages
SET is_active = false
WHERE page_name ILIKE '%Rajwinder%' OR page_name ILIKE '%rajwinder%';

-- Verify that it is now inactive (is_active should be false)
SELECT id, page_name, is_active, updated_at 
FROM connected_pages 
WHERE page_name ILIKE '%Rajwinder%' OR page_name ILIKE '%rajwinder%';
