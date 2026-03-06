const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');

let url = '', key = '';
envFile.split('\n').forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim();
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim();
});

const supabase = createClient(url, key);

async function runQueries() {
    console.log("==================================================");
    console.log("TEST 1: Last 10 Leads");
    console.log("==================================================");
    const q1 = `
    SELECT id, name, phone, status, assigned_to, source, notes, created_at
    FROM leads 
    ORDER BY created_at DESC
    LIMIT 10;
  `;
    const { data: d1, error: e1 } = await supabase.rpc('exec_sql', { sql_query: q1 });
    if (e1) console.error(e1); else console.table(d1);


    console.log("\n==================================================");
    console.log("TEST 2: Unassigned Leads (Last 7 Days)");
    console.log("==================================================");
    const q2 = `
    SELECT status, COUNT(*) as count
    FROM leads
    WHERE assigned_to IS NULL
    AND created_at > NOW() - INTERVAL '7 days'
    GROUP BY status
    ORDER BY count DESC;
  `;
    const { data: d2, error: e2 } = await supabase.rpc('exec_sql', { sql_query: q2 });
    if (e2) console.error(e2); else console.table(d2);


    console.log("\n==================================================");
    console.log("TEST 3: Active Users for Distribution");
    console.log("==================================================");
    const q3 = `
    SELECT name, email, plan_name, daily_limit, is_active, is_online, total_leads_received, total_leads_promised, team_code
    FROM users 
    WHERE is_active = true 
    AND role IN ('member', 'manager')
    ORDER BY is_online DESC, plan_name
    LIMIT 20;
  `;
    const { data: d3, error: e3 } = await supabase.rpc('exec_sql', { sql_query: q3 });
    if (e3) console.error(e3); else console.table(d3);


    console.log("\n==================================================");
    console.log("TEST 4: Webhook Errors (Recent)");
    console.log("==================================================");
    const q4 = `
    SELECT * FROM webhook_errors
    ORDER BY created_at DESC
    LIMIT 5;
  `;
    const { data: d4, error: e4 } = await supabase.rpc('exec_sql', { sql_query: q4 });
    if (e4) console.error(e4); else console.table(d4);


    console.log("\n==================================================");
    console.log("TEST 5: Orphan Leads (Last 7 Days)");
    console.log("==================================================");
    const q5 = `
    SELECT status, miss_reason, COUNT(*) as count
    FROM orphan_leads
    WHERE created_at > NOW() - INTERVAL '7 days'
    GROUP BY status, miss_reason
    ORDER BY count DESC;
  `;
    const { data: d5, error: e5 } = await supabase.rpc('exec_sql', { sql_query: q5 });
    if (e5) {
        if (e5.message.includes('does not exist')) {
            console.log('Table orphan_leads does not exist.');
        } else {
            console.error(e5);
        }
    } else {
        console.table(d5);
    }
}

runQueries();
