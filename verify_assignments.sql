-- ==============================================================================
-- VERIFICATION SCRIPT: Run this in Supabase SQL Editor
-- ==============================================================================
-- This query fetches all 15 users it was supposed to assign leads to.
-- It checks exactly how many leads they received TODAY (since midnight).
-- It also verifies the earliest and latest timestamps of those assignments,
-- and counts how many of those leads have NULL notes vs populated notes.

SELECT 
    u.email,
    COUNT(l.id) AS leads_assigned_today,
    MIN(l.assigned_at AT TIME ZONE 'Asia/Kolkata') AS first_assignment_time,
    MAX(l.assigned_at AT TIME ZONE 'Asia/Kolkata') AS last_assignment_time,
    COUNT(CASE WHEN l.notes IS NULL OR TRIM(l.notes) = '' THEN 1 END) AS null_or_empty_notes_count,
    COUNT(CASE WHEN l.notes IS NOT NULL AND TRIM(l.notes) != '' THEN 1 END) AS populated_notes_count
FROM 
    users u
LEFT JOIN 
    leads l 
ON 
    u.id = l.assigned_to 
    AND l.assigned_at >= CURRENT_DATE 
WHERE 
    u.email IN (
        'mandeepkau340@gmail.com',
        'singhmanbir938@gmail.com',
        'dhawantanu536@gmail.com',
        'harmandeepkaurmanes790@gmail.com',
        'gurnoor1311singh@gmail.com',
        'sainsachin737@gmail.com',
        'harpreetk61988@gmail.com',
        'kulwantsinghdhaliwalsaab668@gmail.com',
        'prince@gmail.com',
        'ranjodhmomi@gmail.com',
        'rupanasameer551@gmail.com',
        'priyajotgoyal@gmail.com',
        'salonirajput78690@gmail.com',
        'dw656919@gmail.com',
        'komalkomal96534@gmail.com'
    )
GROUP BY 
    u.email
ORDER BY 
    leads_assigned_today DESC;
