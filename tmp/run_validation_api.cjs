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
    const { data: d1, error: e1 } = await supabase
        .from('leads')
        .select('id, name, phone, status, assigned_to, source, notes, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
    if (e1) console.error(e1); else console.table(d1);


    console.log("\n==================================================");
    console.log("TEST 2: Unassigned Leads (Last 7 Days)");
    console.log("==================================================");
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: rawD2, error: e2 } = await supabase
        .from('leads')
        .select('status, id')
        .is('assigned_to', null)
        .gt('created_at', sevenDaysAgo.toISOString());

    if (e2) {
        console.error(e2);
    } else {
        // Count locally since no 'COUNT(*) GROUP BY' raw API
        const counts = rawD2.reduce((acc, row) => {
            acc[row.status] = (acc[row.status] || 0) + 1;
            return acc;
        }, {});
        console.table(Object.keys(counts).map(status => ({ status, count: counts[status] })).sort((a, b) => b.count - a.count));
    }


    console.log("\n==================================================");
    console.log("TEST 3: Active Users for Distribution");
    console.log("==================================================");
    const { data: rawD3, error: e3 } = await supabase
        .from('users')
        .select('name, email, plan_name, daily_limit, is_active, is_online, total_leads_received, total_leads_promised, team_code, role')
        .eq('is_active', true)
        .in('role', ['member', 'manager']);

    if (e3) {
        console.error(e3);
    } else {
        const d3 = rawD3.sort((a, b) => {
            if (a.is_online !== b.is_online) return b.is_online ? 1 : -1;
            return (a.plan_name || '').localeCompare(b.plan_name || '');
        }).slice(0, 20);
        // Remove Role since user didn't request output of role, just used it to filter
        const finalD3 = d3.map(({ role, ...kept }) => kept);
        console.table(finalD3);
    }


    console.log("\n==================================================");
    console.log("TEST 4: Webhook Errors (Recent)");
    console.log("==================================================");
    const { data: d4, error: e4 } = await supabase
        .from('webhook_errors')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
    if (e4) {
        if (e4.message.includes('relation "public.webhook_errors" does not exist')) {
            console.log("(Table webhook_errors does not exist yet.)");
        } else {
            console.error(e4);
        }
    } else {
        console.table(d4);
    }


    console.log("\n==================================================");
    console.log("TEST 5: Orphan Leads (Last 7 Days)");
    console.log("==================================================");
    const { data: rawD5, error: e5 } = await supabase
        .from('orphan_leads')
        .select('status, miss_reason, id')
        .gt('created_at', sevenDaysAgo.toISOString());

    if (e5) {
        if (e5.message.includes('does not exist')) {
            console.log('Table orphan_leads does not exist.');
        } else {
            console.error(e5);
        }
    } else {
        const counts5 = rawD5.reduce((acc, row) => {
            const key = `${row.status}|||${row.miss_reason}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
        console.table(Object.keys(counts5).map(key => {
            const [status, miss_reason] = key.split('|||');
            return { status, miss_reason, count: counts5[key] };
        }).sort((a, b) => b.count - a.count));
    }
}

runQueries();
