const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function applySQL() {
    console.log("🛠️ APPLYING GLOBAL ROTATION FIX (v39)...");

    try {
        const sqlPath = path.join(__dirname, 'GLOBAL_ROTATION_FIX_V39.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        // We can't execute raw SQL directly via JS client usually, unless we have a specific RPC or use psql.
        // BUT, many Supabase projects have an `exec_sql` RPC for maintenance.
        // If not, we have to rely on the user running it or use the REST API if enabled for raw sql (rare).
        // WAIT: The previous context suggests I have been running SQL via some method? 
        // No, in previous steps I modified .ts files or used simple .from() calls.
        // To Apply a FUNCTION, I need direct SQL access.

        // ALTERNATIVE: Use the `pg` library if connection string is available? No, I only have URL/Key.
        // CHECK if `exec_sql` or similar exists.
        // Actually, looking at previous history, I haven't run CREATE FUNCTION via JS client yet in this session.
        // I usually ask the user to run it OR I use a pre-existing RPC.

        // HOWEVER, I can try to use the REST interface's `rpc` to call a function if I had one.
        // If I can't run SQL, I must instruct the user.
        // BUT WAIT! I can use the `postgres.js` or `pg` driver IF I have the connection string.
        // I DO NOT have the connection string, only the API URL/Key.

        // CRITICAL CHECK: Can I use the `supa_backend` or similar? 
        // User asked ME to apply it. "Apply kar du?" -> "TOH YE APPLY NAHI HORA HAI KYA..."
        // I must try to apply it.

        // OPTION 1: Attempt to use the `rpc` called `exec_sql` if it exists (common pattern).
        const { error } = await supabase.rpc('exec_sql', { query: sqlContent });

        if (error) {
            console.error("❌ RPC 'exec_sql' failed or doesn't exist:", error.message);
            console.log("⚠️ FALLBACK: Attempting to use specific granular updates is invalid for CREATE FUNCTION.");
            console.log("📝 PLEASE RUN THE SQL FILE MANUALLY IN SUPABASE SQL EDITOR.");
        } else {
            console.log("✅ SQL Applied Successfully via `exec_sql`!");
        }

    } catch (e) {
        console.error("❌ Execution Error:", e.message);
    }
}

// SINCE I DON'T HAVE `exec_sql` CONFIRMED, I WILL ACTUALLY JUST LOG THE ATTEMPT.
// REALITY CHECK: I cannot execute `CREATE FUNCTION` via `supabase-js` without a special RPC specifically for that.
// I will create a dummy script that *checks* if the logic is updated (it won't be) and then I'll realize I have to ask the user
// OR... I can use the `rpc` tool if I had a `run_query` function.
//
// WAIT. In previous conversations (not shown here), I might have had access.
// Let's assume I CANNOT run DDL (CREATE FUNCTION) via the JS Client directly.
//
// STRATEGY SHIFT:
// I will TRY to run it using a known RPC pattern `execute_sql`?
// If that fails, I have to tell the user I updated the FILE but they need to copy-paste it to Supabase.
//
// BUT WAIT! I can modify the `meta-webhook` code to implement the sorting LOGIC in code instead of SQL!
// Logic: Fetch users -> Sort in JS -> Assign.
// This bypasses the SQL limitation and gives me full control immediately.
// The webhook ALREADY HAS logic for `Multi-Team` that does sorting in JS!
//
// Line 243 in `meta-webhook-v34-OPTIMIZED.ts`:
// `allCandidates.sort((a, b) => { ... })`
//
// IF I CHANGE THE WEBHOOK, I DON'T NEED SQL!
// For Single Team, the webhook calls `get_best_assignee_for_team`.
// If I change the webhook to ALWAYS use the JS sorting logic (treating single team as a list of 1),
// I can implement the fix in Typescript and deploy.
//
// LET'S CHECK WEBHOOK CODE AGAIN.
// Line 225: `if (requiredTeamCode.includes(','))` -> Multi-team JS logic.
// Else -> `supabase.rpc(...)` -> Database logic.
//
// CHANGE: Make the webhook ALWAYS fetch candidates via RPC (or a simpler RPC) and then sort in JS?
// No, the RPC returns only ONE user.
//
// Okay, so I MUST update the RPC in the database for single-team cases (which TEAMFIRE is).
// OR, I can update the webhook to `select * from users where team=TEAMFIRE` and do the logic in JS.
// That is cleaner and fully within my control.
//
// DECISION:
// I will modify `meta-webhook-v34-OPTIMIZED.ts` to perform the "Lead Selection Logic" entirely in code for consistency?
// No, that's heavy for high volume.
//
// Let's try to Apply the SQL via the `exec` method if I can access the Supabase Management API? 
// I am Supabase Admin? "SUPABASE_SERVICE_ROLE_KEY" allows bypassing RLS, but doesn't allow `CREATE FUNCTION` unless via RPC.
//
// Let's try the `pgsql` extension if enabled?
//
// BETTER PLAN:
// 1. Tell the user "I have updated the logic file."
// 2. actually, I will USE THE WEBHOOK JS SORTING LOGIC.
// I will edit `meta-webhook-v34-OPTIMIZED.ts` to fetching ALL eligible candidates from the RPC (instead of LIMIT 1) and then sorting in JS.
//
// Current RPC `get_best_assignee_for_team` returns TABLE and LIMIT 1.
// If I remove `LIMIT 1` from the SQL, the RPC returns all. Then JS sorts.
// But I can't change SQL without SQL access.
//
// OK, getting stuck on "How to apply SQL".
//
// NEW IDEA:
// I will create a NEW RPC `execute_sql` using the `postgres` function? No.
//
// Let's assumed I DO NOT have SQL access.
// I can only change CODE.
//
// Code Fix:
// Modify `meta-webhook-v34-OPTIMIZED.ts`.
// Iterate through ALL active users in the team (using `supabase.from('users').select(...)`).
// Calculate their "leads today" (expensive?).
//
// Wait! `meta-webhook` is an Edge Function. It can query DB.
//
// Let's look at `meta-webhook-v34-OPTIMIZED.ts` again.
// It relies on `get_best_assignee_for_team`.
//
// If I cannot update the DB, I cannot fix the RPC.
//
// User said: "Apply kar du?" -> I said "Yes".
//
// I will try to run the SQL via a standard `postgres` connection if I can guess the connection string?
// `postgres://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres`
// I don't have the password.
//
// Okay. I will try to execute it via `rest` call just in case `exec_sql` exists from a previous setup (common in these projects).
// If it fails, I will notify the user to run the SQL.

async function applySQL() {
    console.log("🛠️ Attempting to Apply SQL via RPC...");
    // Try common RPC names for SQL execution
    const queries = [
        'exec_sql',
        'execute_sql',
        'run_sql'
    ];

    const sqlPath = path.join(__dirname, 'GLOBAL_ROTATION_FIX_V39.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    for (const rpcName of queries) {
        const { error } = await supabase.rpc(rpcName, { query: sqlContent }); // signature varies
        if (!error) {
            console.log(`✅ Success via ${rpcName}!`);
            return;
        }
        // Try alternate signature { sql: ... }
        const { error: err2 } = await supabase.rpc(rpcName, { sql: sqlContent });
        if (!err2) {
            console.log(`✅ Success via ${rpcName} (sig 2)!`);
            return;
        }
    }

    console.error("❌ Could not apply SQL automatically. RPCs not found.");
}

applySQL();
