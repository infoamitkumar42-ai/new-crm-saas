-- ============================================================================
-- 🗑️ DELETE DUPLICATES FROM SANDEEP (READY TO RUN)
-- ============================================================================

-- DELETE 8 duplicate leads by their IDs
DELETE FROM leads
WHERE id IN (
    '43bb2b5e-5f2c-4e9b-8cd7-62ef07ea5a3b',
    'f5472343-fd78-494c-bb83-9978ec86131f',
    'be7c6b23-71cf-4802-8088-f740efc7b548',
    '5067409e-a089-4c56-874d-825ede2dff77',
    'a36d3fc9-0922-4b49-885a-129c247f9461',
    '03e43639-6d62-4a9e-ac01-6d8c936db353',
    '0c029a62-3e8e-42b6-b6c2-a371c009f1d4',
    'ea70fcb6-eb32-4958-a9cb-101fb166b542'
);

-- Update Sandeep's leads_today counter (-8)
UPDATE users SET leads_today = leads_today - 8 
WHERE email = 'sunnymehre451@gmail.com';

-- Verify
SELECT name, email, leads_today FROM users WHERE email = 'sunnymehre451@gmail.com';
