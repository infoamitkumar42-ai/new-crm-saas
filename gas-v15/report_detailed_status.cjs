
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnv() {
    try {
        const paths = [
            path.join(process.cwd(), '.env'),
            path.join('C:', 'Users', 'HP', 'Downloads', 'new-crm-saas', '.env')
        ];
        for (const p of paths) {
            if (fs.existsSync(p)) {
                const envContent = fs.readFileSync(p, 'utf8');
                const env = {};
                envContent.split('\n').forEach(line => {
                    const [key, ...parts] = line.split('=');
                    if (key && parts.length > 0) env[key.trim()] = parts.join('=').trim().replace(/^["']|["']$/g, '');
                });
                return env;
            }
        }
    } catch (e) { return process.env; }
    return {};
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function reportStatus() {
    console.log("📊 Generating Detailed Status Report...\n");

    const { data: users, error } = await supabase
        .from('users')
        .select('name, email, leads_today, daily_limit, is_active, plan_name')
        .eq('is_active', true)
        .neq('plan_name', 'none');

    if (error) { console.error("❌ Error:", error.message); return; }

    let totalDistributed = 0;
    let totalCapacity = 0;

    const limitReached = [];
    const limitRemaining = [];

    users.forEach(u => {
        const today = u.leads_today || 0;
        const limit = u.daily_limit || 0;

        totalDistributed += today;
        totalCapacity += limit;

        if (today >= limit) {
            limitReached.push(u);
        } else {
            limitRemaining.push({
                name: u.name,
                today: today,
                limit: limit,
                remaining: limit - today
            });
        }
    });

    // Output
    console.log(`📈 TOTAL STATISTICS:`);
    console.log(`   - Total Leads Distributed:  ${totalDistributed}`);
    console.log(`   - Total Daily Capacity:     ${totalCapacity}`);
    console.log(`   - Active Users:             ${users.length}`);
    console.log(`-----------------------------------------------`);

    console.log(`🔴 LIMIT REACHED (${limitReached.length} Users):`);
    console.log(`   (No more leads for them today)`);
    limitReached.slice(0, 10).forEach(u =>
        console.log(`   - ${u.name.padEnd(20)} (${u.leads_today}/${u.daily_limit})`)
    );
    if (limitReached.length > 10) console.log(`   ... and ${limitReached.length - 10} more.`);

    console.log(`\n🟢 LIMIT REMAINING (${limitRemaining.length} Users):`);
    console.log(`   (System will assign next leads to them)`);

    // Sort by remaining capacity (descending)
    limitRemaining.sort((a, b) => b.remaining - a.remaining);

    limitRemaining.forEach(u => {
        console.log(`   - ${u.name.padEnd(25)} : Got ${u.today}/${u.limit} (Pending: ${u.remaining})`);
    });

}

reportStatus();
