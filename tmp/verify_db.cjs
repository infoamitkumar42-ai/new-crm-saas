const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
let url = '', key = '';
envFile.split('\n').forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim();
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim();
});

const supabase = createClient(url, key);

async function verify() {
    console.log("=== VERIFICATION 7: Active Users Ready ===");
    const { data: users, error: uErr } = await supabase
        .from('users')
        .select('name, email, team_code, plan_name, plan_weight, daily_limit, total_leads_received, total_leads_promised, is_active, is_online')
        .eq('is_active', true)
        .in('role', ['member', 'manager'])
        .order('plan_weight', { ascending: false });
    if (uErr) console.error(uErr);
    else console.table(users);

    console.log("\n=== VERIFICATION 8: Meta Pages Mapping ===");
    const { data: pages, error: pErr } = await supabase
        .from('meta_pages')
        .select('page_name, team_id');
    if (pErr) console.error(pErr);
    else console.table(pages);

    console.log("\n=== VERIFICATION 10: Final Test — RPC Function ===");
    const { data: rpcRes, error: rpcErr } = await supabase.rpc('get_best_assignee_for_team', { p_team_code: 'TEAMFIRE' });
    if (rpcErr) console.error(rpcErr);
    else console.table(rpcRes);
}

verify();
