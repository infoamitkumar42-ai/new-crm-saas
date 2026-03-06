const { Client } = require('pg');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
let dbUrl = '';

// Try to find direct Postgres URL
envFile.split('\n').forEach(line => {
    if (line.startsWith('DATABASE_URL=')) dbUrl = line.split('=')[1].trim();
});

if (!dbUrl) {
    // Construct pooled connection string if missing
    let pass = '';
    envFile.split('\n').forEach(line => {
        if (line.startsWith('SUPABASE_DB_PASSWORD=')) pass = line.split('=')[1].trim();
    });
    // Assuming typical supabase pattern if available (which might not be, let's just attempt lookup)
    console.error("DATABASE_URL not explicitly set in .env");
    process.exit(1);
}

const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
});

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
    v_team_array := string_to_array(REPLACE(p_team_code, ' ', ''), ',');

    SELECT u.id INTO v_selected_id
    FROM users u
    WHERE u.team_code = ANY(v_team_array)
      AND u.is_active = true
      AND u.is_online = true
      AND u.role IN ('member', 'manager')
      AND (
          u.total_leads_received < u.total_leads_promised 
          OR u.total_leads_promised = 0 
          OR u.total_leads_promised IS NULL
      )
      AND (
          (SELECT COUNT(*) FROM leads l 
           WHERE l.assigned_to = u.id 
           AND to_char(l.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') = to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')
          ) < u.daily_limit 
          OR u.daily_limit = 0 
          OR u.daily_limit IS NULL
      )
      AND (
          (SELECT COUNT(*) FROM leads l 
           WHERE l.assigned_to = u.id 
           AND to_char(l.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') = to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')
          ) < FLOOR(u.daily_limit * 0.6)
      )
    ORDER BY 
        (SELECT COUNT(*) FROM leads l 
         WHERE l.assigned_to = u.id 
         AND to_char(l.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') = to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')
        )::float / GREATEST(FLOOR(u.daily_limit * 0.6), 1) ASC,
        COALESCE(u.plan_weight, 1) ASC,
        RANDOM()
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF v_selected_id IS NULL THEN
        SELECT u.id INTO v_selected_id
        FROM users u
        WHERE u.team_code = ANY(v_team_array)
          AND u.is_active = true
          AND u.is_online = true
          AND u.role IN ('member', 'manager')
          AND (
              u.total_leads_received < u.total_leads_promised 
              OR u.total_leads_promised = 0 
              OR u.total_leads_promised IS NULL
          )
          AND (
              (SELECT COUNT(*) FROM leads l 
               WHERE l.assigned_to = u.id 
               AND to_char(l.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') = to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')
              ) < u.daily_limit 
              OR u.daily_limit = 0 
              OR u.daily_limit IS NULL
          )
        ORDER BY 
            (SELECT COUNT(*) FROM leads l 
             WHERE l.assigned_to = u.id 
             AND to_char(l.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') = to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')
            )::float / GREATEST(COALESCE(u.plan_weight, 1), 1) ASC,
            COALESCE(u.plan_weight, 1) DESC,
            RANDOM()
        LIMIT 1
        FOR UPDATE SKIP LOCKED;
    END IF;

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
END;
$function$;
`;

async function execute() {
    try {
        await client.connect();
        console.log("Connected to PostgreSQL successfully.");

        await client.query('BEGIN');
        console.log("Creating/Updating Function...");
        await client.query(sqlFunctionDef);
        await client.query('COMMIT');
        console.log("✅ get_best_assignee_for_team function created successfully.");

        const checkRes = await client.query("SELECT routine_name, routine_type FROM information_schema.routines WHERE routine_name = 'get_best_assignee_for_team';");
        console.log("\nVerification 1:");
        console.table(checkRes.rows);

        const testRes = await client.query("SELECT * FROM get_best_assignee_for_team('TEAMFIRE');");
        console.log("\nVerification 2 (TEAMFIRE):");
        console.table(testRes.rows);

    } catch (err) {
        console.error("PG ERROR:", err);
        await client.query('ROLLBACK').catch(e => { });
    } finally {
        await client.end();
    }
}

execute();
