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
    const output = {};

    const { data: users, error: uErr } = await supabase
        .from('users')
        .select('name, email, team_code, plan_name, plan_weight, daily_limit, total_leads_received, total_leads_promised, is_active, is_online')
        .eq('is_active', true)
        .in('role', ['member', 'manager'])
        .order('plan_weight', { ascending: false });

    output.users = uErr ? uErr : users;

    const { data: pages, error: pErr } = await supabase
        .from('meta_pages')
        .select('page_name, team_id');

    output.pages = pErr ? pErr : pages;

    const { data: rpcRes, error: rpcErr } = await supabase.rpc('get_best_assignee_for_team', { p_team_code: 'TEAMFIRE' });
    output.rpc = rpcErr ? rpcErr : rpcRes;

    fs.writeFileSync('tmp/verify_json.json', JSON.stringify(output, null, 2), 'utf8');
    console.log('Saved to tmp/verify_json.json');
}

verify();
