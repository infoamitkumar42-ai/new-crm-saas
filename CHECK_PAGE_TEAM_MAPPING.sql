-- ============================================================================
-- 🔍 CHECK FACEBOOK PAGE TO TEAM MAPPING
-- ============================================================================

-- Query 1: Check all Facebook pages and their team mappings
SELECT 
    page_id,
    page_name,
    team_id,
    access_token_status,
    is_active
FROM facebook_pages
ORDER BY page_name;

-- Query 2: Check which team code is assigned to Himanshu's page
SELECT 
    page_name,
    team_id,
    is_active
FROM facebook_pages
WHERE page_name LIKE '%Himanshu%' OR page_name LIKE '%Work With%';

-- Query 3: Check TEAMSIMRAN users - are they active?
SELECT 
    name,
    email,
    is_active,
    payment_status,
    total_leads_received,
    total_leads_promised
FROM users
WHERE team_code = 'TEAMSIMRAN'
ORDER BY is_active DESC, name;
