-- Audit Connected Pages
-- Checking if Rajwinder's Page ID is correctly mapped or if it's missing/duplicated

SELECT 
    id, 
    page_name, 
    page_id, 
    manager_id, 
    (SELECT name FROM users WHERE id = connected_pages.manager_id) as manager_name,
    is_active,
    created_at
FROM connected_pages
ORDER BY created_at DESC;

-- Also check for any today's leads source distribution again to match with page mappings
SELECT source, count(*) 
FROM leads 
WHERE created_at >= CURRENT_DATE 
GROUP BY source;
