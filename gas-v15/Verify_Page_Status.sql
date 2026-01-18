-- Verify Page Status: Ensure Himanshu is ACTIVE and Rajwinder is INACTIVE

SELECT id, page_name, is_active, updated_at 
FROM connected_pages
WHERE page_name ILIKE '%Himanshu%' OR page_name ILIKE '%Rajwinder%';
