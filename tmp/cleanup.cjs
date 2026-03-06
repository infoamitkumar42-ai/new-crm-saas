const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
let url = '', key = '';
envFile.split('\n').forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim();
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim();
});

const supabase = createClient(url, key);

async function run() {
    console.log("═══════════════════════════════════════════");
    console.log("STEP 1: DEACTIVATE all unpaid users");
    console.log("═══════════════════════════════════════════");

    const keepEmails = [
        'bhawna1330@gmail.com',
        'ravenjeetkaur@gmail.com',
        'ajayk783382@gmail.com',
        'simmiteja3@gmail.com',
        'mt5567519@gmail.com',
        'aansh8588@gmail.com',
        'ananyakakkar53b@gmail.com'
    ];

    const { data: step1Data, error: step1Err } = await supabase
        .from('users')
        .update({
            is_active: false,
            is_online: false,
            updated_at: new Date().toISOString()
        })
        .in('role', ['member', 'manager'])
        .eq('is_active', true)
        .not('email', 'in', `(${keepEmails.map(e => `"${e}"`).join(',')})`)
        .select();

    if (step1Err) {
        console.error("Step 1 Error:", step1Err);
    } else {
        console.log(`Rows affected (Deactivated): ${step1Data.length}`);
    }

    console.log("\n═══════════════════════════════════════════");
    console.log("STEP 2: FIX 7 paid users — CORRECT quotas");
    console.log("═══════════════════════════════════════════");

    const updates = [
        {
            email: 'bhawna1330@gmail.com',
            update: { is_active: true, is_online: true, total_leads_received: 0, total_leads_promised: 115, daily_limit: 7, plan_name: 'supervisor', plan_weight: 3, updated_at: new Date().toISOString() }
        },
        {
            email: 'ravenjeetkaur@gmail.com',
            update: { is_active: true, is_online: true, total_leads_received: 0, total_leads_promised: 92, daily_limit: 12, plan_name: 'weekly_boost', plan_weight: 7, updated_at: new Date().toISOString() }
        },
        {
            email: 'ajayk783382@gmail.com',
            update: { is_active: true, is_online: true, total_leads_received: 0, total_leads_promised: 92, daily_limit: 12, plan_name: 'weekly_boost', plan_weight: 7, updated_at: new Date().toISOString() }
        },
        {
            email: 'aansh8588@gmail.com',
            update: { is_active: true, is_online: true, total_leads_received: 0, total_leads_promised: 92, daily_limit: 12, plan_name: 'weekly_boost', plan_weight: 7, updated_at: new Date().toISOString() }
        },
        {
            email: 'simmiteja3@gmail.com',
            update: { is_active: true, is_online: true, total_leads_received: 0, total_leads_promised: 55, daily_limit: 5, plan_name: 'starter', plan_weight: 1, team_code: 'TEAMSIMRAN', updated_at: new Date().toISOString() }
        },
        {
            email: 'mt5567519@gmail.com',
            update: { is_active: true, is_online: true, total_leads_received: 0, total_leads_promised: 55, daily_limit: 5, plan_name: 'starter', plan_weight: 1, team_code: 'TEAMSIMRAN', updated_at: new Date().toISOString() }
        },
        {
            email: 'ananyakakkar53b@gmail.com',
            update: { is_active: true, is_online: true, total_leads_received: 0, total_leads_promised: 115, daily_limit: 7, plan_name: 'supervisor', plan_weight: 3, team_code: 'TEAMFIRE', updated_at: new Date().toISOString() }
        }
    ];

    let step2Count = 0;
    for (const u of updates) {
        const { data, error } = await supabase.from('users').update(u.update).eq('email', u.email).select();
        if (error) console.error(`Error updating ${u.email}:`, error);
        else if (data && data.length > 0) step2Count++;
    }
    console.log(`Successfully updated ${step2Count} users.`);

    console.log("\n═══════════════════════════════════════════");
    console.log("STEP 3: VERIFY — Show final state");
    console.log("═══════════════════════════════════════════");

    const { data: step3Data, error: step3Err } = await supabase
        .from('users')
        .select('name, email, team_code, plan_name, plan_weight, daily_limit, total_leads_received, total_leads_promised, is_active, is_online')
        .eq('is_active', true)
        .in('role', ['member', 'manager']);

    if (step3Err) {
        console.error("Step 3 Error:", step3Err);
    } else {
        step3Data.sort((a, b) => {
            if (a.team_code !== b.team_code) {
                return (a.team_code || '').localeCompare(b.team_code || '');
            }
            return (b.plan_weight || 0) - (a.plan_weight || 0);
        });
        // Removing email from table for cleaner output if needed, but requested to show all, so writing JSON
        fs.writeFileSync('tmp/cleanup_output.json', JSON.stringify(step3Data, null, 2));
        console.log(`Verified ${step3Data.length} active users. Results saved to tmp/cleanup_output.json`);
    }
}

run();
