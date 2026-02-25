const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://vewqzsqddgmkslnuctvb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us');

const sql = `
-- 1. CLEANUP ALL SIGNATURES
DROP FUNCTION IF EXISTS public.get_best_assignee_for_team(TEXT);
DROP FUNCTION IF EXISTS public.get_best_assignee_for_team(TEXT, TEXT);

-- 2. DEPLOY v39
CREATE OR REPLACE FUNCTION public.get_best_assignee_for_team(
    p_team_code TEXT
)
RETURNS TABLE (
    user_id UUID,
    user_name TEXT,
    user_email TEXT,
    plan_name TEXT,
    daily_limit INT,
    leads_today BIGINT,
    total_leads_received INT,
    total_leads_promised INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH today_counts AS (
        SELECT 
            u.id,
            u.name,
            u.email,
            u.plan_name,
            u.daily_limit,
            u.total_leads_received AS total_received,
            u.total_leads_promised AS total_promised,
            COALESCE(
                (SELECT COUNT(*) 
                 FROM leads l 
                 WHERE l.assigned_to = u.id 
                 AND to_char(l.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') = to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')
                ),
                0
            ) AS leads_today_calc
        FROM users u
        WHERE (TRIM(u.team_code) = TRIM(p_team_code) OR u.team_code = p_team_code)
          AND u.is_active = true
          AND u.is_online = true
          AND u.role IN ('member', 'manager')
    ),
    eligible_users AS (
        SELECT *
        FROM today_counts
        WHERE 
            (leads_today_calc < daily_limit OR daily_limit = 0 OR daily_limit IS NULL)
            AND (total_received < total_promised OR total_promised = 0 OR total_promised IS NULL)
    )
    SELECT 
        eu.id,
        eu.name,
        eu.email,
        eu.plan_name,
        eu.daily_limit,
        eu.leads_today_calc,
        eu.total_received,
        eu.total_promised
    FROM eligible_users eu
    ORDER BY
        (CASE WHEN eu.leads_today_calc = 0 THEN 0 ELSE 1 END) ASC,
        (CASE WHEN eu.leads_today_calc % 2 = 1 THEN 0 ELSE 1 END) ASC,
        (CASE 
            WHEN LOWER(eu.plan_name) LIKE '%turbo%' OR LOWER(eu.plan_name) LIKE '%boost%' THEN 4
            WHEN LOWER(eu.plan_name) LIKE '%manager%' THEN 3
            WHEN LOWER(eu.plan_name) LIKE '%supervisor%' THEN 2
            WHEN LOWER(eu.plan_name) LIKE '%starter%' THEN 1
            ELSE 0
        END) DESC,
        eu.leads_today_calc ASC,
        eu.id ASC
    LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_best_assignee_for_team(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_best_assignee_for_team(TEXT) TO service_role;
`;

async function run() {
    try {
        console.log('--- 🚀 DEPLOYING GLOBAL ROTATION v39 ---');
        const { error: deployError } = await s.rpc('execute_sql_query', { query: sql });
        if (deployError) throw deployError;
        console.log('✅ v39 Deployed Successfully.');

        console.log('\n--- 📊 CROSS-TEAM VERIFICATION ---');
        const teams = ['GJ01TEAMFIRE', 'TEAMFIRE', 'TEAMRAJ'];
        for (const t of teams) {
            const { data, error } = await s.rpc('get_best_assignee_for_team', { p_team_code: t });
            if (error) {
                console.error(`❌ Team ${t} RPC Error:`, error.message);
                continue;
            }
            if (data && data.length > 0) {
                const u = data[0];
                console.log(`Team ${t} -> Next: ${u.user_name} (${u.user_email}) | Today: ${u.leads_today} | Plan: ${u.plan_name}`);
            } else {
                console.log(`Team ${t} -> Next: NONE ELIGIBLE`);
            }
        }
    } catch (e) {
        console.error('CRITICAL ERROR:', e);
    }
}

run();
