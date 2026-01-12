-- Check User IDs
SELECT id, name, email, leads_today, total_leads_received 
FROM users 
WHERE name ILIKE '%Rajwinder%' 
   OR name ILIKE '%Sandeep%' 
   OR name ILIKE '%Gurnam%';

-- Check Available New Leads
SELECT count(*) as available_leads 
FROM leads 
WHERE lead_status = 'New';
