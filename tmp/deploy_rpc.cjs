const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
let url = '', key = '';
envFile.split('\n').forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim();
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim();
});

const supabase = createClient(url, key);

const sqlFunctionDef = `
CREATE OR REPLACE FUNCTION public.get_best_assignee_for_team(p_team_code text)
 RETURNS TABLE(
   user_id uuid, user_name text, user_email text, 
   plan_name text, daily_limit integer, leads_today bigint, 
   total_leads_received integer, total_leads_promised integer, 
   out_user_id uuid, out_user_name text, out_user_email text, 
   out_plan_name text, out_daily_limit integer, out_leads_today bigint, 
   out_total_received integer, out_total_promised integer
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_team_array TEXT[];
    v_selected_id UUID;
    v_user_leads_today BIGINT;
    v_user_daily_limit INT;
    v_user_guaranteed_min INT;
    v_user_weight INT;
BEGIN
    -- Parse team codes (handles comma-separated multi-team)
    v_team_array := string_to_array(REPLACE(p_team_code, ' ', ''), ',');

    /*
     * ══════════════════════════════════════════════════════════════
     * PHASE 1: GUARANTEED MINIMUM (60% of daily_limit)
     * ══════════════════════════════════════════════════════════════
     * First, find users who haven't received their guaranteed minimum.
     * Priority: Users with LOWEST percentage of guarantee filled.
     * This ensures EVERYONE gets their minimum before bonus phase.
     */
    
    SELECT u.id INTO v_selected_id
    FROM users u
    WHERE u.team_code = ANY(v_team_array)
      AND u.is_active = true
      AND u.is_online = true
      AND u.role IN ('member', 'manager')
      -- Quota check: User still has quota remaining
      AND (
          u.total_leads_received < u.total_leads_promised 
          OR u.total_leads_promised = 0 
          OR u.total_leads_promised IS NULL
      )
      -- Daily limit check: User hasn't hit daily cap
      AND (
          (SELECT COUNT(*) FROM leads l 
           WHERE l.assigned_to = u.id 
           AND to_char(l.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') = to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')
          ) < u.daily_limit 
          OR u.daily_limit = 0 
          OR u.daily_limit IS NULL
      )
      -- PHASE 1 FILTER: Only users who HAVEN'T hit their guaranteed minimum yet
      AND (
          (SELECT COUNT(*) FROM leads l 
           WHERE l.assigned_to = u.id 
           AND to_char(l.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') = to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')
          ) < FLOOR(u.daily_limit * 0.6)  -- 60% of daily_limit = guaranteed minimum
      )
    ORDER BY 
        -- Priority 1: Lowest PERCENTAGE of guarantee filled first
        -- User with 0/3 (0%) beats user with 2/7 (28%)
        (SELECT COUNT(*) FROM leads l 
         WHERE l.assigned_to = u.id 
         AND to_char(l.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') = to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')
        )::float / GREATEST(FLOOR(u.daily_limit * 0.6), 1) ASC,
        
        -- Priority 2: Lower plans first (Starter gets guarantee before Boost)
        -- This ensures smaller plans fill up their guarantee first (survival mode)
        COALESCE(u.plan_weight, 1) ASC,
        
        -- Priority 3: Random tiebreaker
        RANDOM()
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    /*
     * ══════════════════════════════════════════════════════════════
     * PHASE 2: WEIGHTED BONUS (After everyone has minimum)
     * ══════════════════════════════════════════════════════════════
     * If no one found in Phase 1 (everyone has minimum), 
     * then distribute bonus leads using WEIGHTED priority.
     * Higher plan weight = Higher priority for bonus leads.
     */
    
    IF v_selected_id IS NULL THEN
        SELECT u.id INTO v_selected_id
        FROM users u
        WHERE u.team_code = ANY(v_team_array)
          AND u.is_active = true
          AND u.is_online = true
          AND u.role IN ('member', 'manager')
          -- Quota check
          AND (
              u.total_leads_received < u.total_leads_promised 
              OR u.total_leads_promised = 0 
              OR u.total_leads_promised IS NULL
          )
          -- Daily limit check (hard cap - NEVER exceed)
          AND (
              (SELECT COUNT(*) FROM leads l 
               WHERE l.assigned_to = u.id 
               AND to_char(l.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') = to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')
              ) < u.daily_limit 
              OR u.daily_limit = 0 
              OR u.daily_limit IS NULL
          )
        ORDER BY 
            -- Priority 1: WEIGHTED score (leads_today / weight)
            -- Boost (4 leads, weight 7): 4/7 = 0.57
            -- Starter (2 leads, weight 1): 2/1 = 2.00
            -- Boost wins! Gets bonus lead.
            (SELECT COUNT(*) FROM leads l 
             WHERE l.assigned_to = u.id 
             AND to_char(l.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') = to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')
            )::float / GREATEST(COALESCE(u.plan_weight, 1), 1) ASC,
            
            -- Priority 2: Higher weight first (Boost > Supervisor > Starter)
            COALESCE(u.plan_weight, 1) DESC,
            
            -- Priority 3: Random tiebreaker
            RANDOM()
        LIMIT 1
        FOR UPDATE SKIP LOCKED;
    END IF;

    /*
     * ══════════════════════════════════════════════════════════════
     * RETURN SELECTED USER DATA
     * ══════════════════════════════════════════════════════════════
     */
    
    IF v_selected_id IS NOT NULL THEN
        RETURN QUERY
        SELECT 
            eu.id AS user_id,
            eu.name AS user_name,
            eu.email AS user_email,
            eu.plan_name,
            eu.daily_limit,
            (SELECT COUNT(*) FROM leads l 
             WHERE l.assigned_to = eu.id 
             AND to_char(l.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') = to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')
            ) AS leads_today,
            eu.total_leads_received,
            eu.total_leads_promised,
            -- Webhook compatibility fields
            eu.id AS out_user_id,
            eu.name AS out_user_name,
            eu.email AS out_user_email,
            eu.plan_name AS out_plan_name,
            eu.daily_limit AS out_daily_limit,
            (SELECT COUNT(*) FROM leads l 
             WHERE l.assigned_to = eu.id 
             AND to_char(l.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') = to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')
            ) AS out_leads_today,
            eu.total_leads_received AS out_total_received,
            eu.total_leads_promised AS out_total_promised
        FROM users eu
        WHERE eu.id = v_selected_id;
    END IF;
    
    -- If no user found, returns empty (webhook will mark lead as 'Queued')
END;
$function$;
`;

async function run() {
    try {
        console.log("Applying new RPC logic...");
        const { error: applyErr } = await supabase.rpc('exec_sql', { sql_query: sqlFunctionDef });
        if (applyErr) {
            console.error(applyErr);
            throw applyErr;
        }
        console.log("✅ CREATE FUNCTION logic submitted successfully.");

        console.log("\\nVerification Query 1: Function Identity");
        const { data: q1, error: e1 } = await supabase.rpc('exec_sql', {
            sql_query: "SELECT routine_name, routine_type FROM information_schema.routines WHERE routine_name = 'get_best_assignee_for_team';"
        });
        if (e1) console.error("Verify 1 error:", e1);
        else console.table(q1);

        console.log("\\nVerification Query 2: Function Execution (TEAMFIRE)");
        // Note: In Supabase JS, calling RPC directly returns the table structure easily.
        const { data: q2, error: e2 } = await supabase.rpc('get_best_assignee_for_team', { p_team_code: 'TEAMFIRE' });

        if (e2) console.error("Verify 2 error:", e2);
        else if (!q2 || q2.length === 0) console.log("No valid user returned (0 rows). All users might be offline, at capacity, or inactive.");
        else console.table(q2);

    } catch (err) {
        console.error("FATAL ERROR:", err.message);
    }
}
run();
