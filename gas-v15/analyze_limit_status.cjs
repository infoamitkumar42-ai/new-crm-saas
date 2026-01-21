
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

async function analyzeLimits() {
    console.log("📊 Analyzing User Limits & Zero Leads...");

    // Fetch Active Users
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, daily_limit, leads_today, plan_name, valid_until')
        .eq('is_active', true)
        .neq('plan_name', 'none')
        .gt('valid_until', new Date().toISOString());

    if (error || !users) {
        console.error("❌ Error fetching users:", error);
        return;
    }

    let limitReachedCount = 0;
    let zeroLeadsCount = 0;
    const zeroLeadUsers = [];
    const limitReachedUsers = [];
    let totalCapacity = 0;
    let totalDistributed = 0;

    users.forEach(u => {
        const leads = u.leads_today || 0;
        const limit = u.daily_limit || 0;

        totalDistributed += leads;
        totalCapacity += limit;

        if (leads >= limit && limit > 0) {
            limitReachedCount++;
            limitReachedUsers.push(`${u.name} (${leads}/${limit})`);
        }

        if (leads === 0) {
            zeroLeadsCount++;
            zeroLeadUsers.push(`${u.name} (${u.plan_name})`);
        }
    });

    console.log("\n-------------------------------------------");
    console.log(`👥 Total Active Users: ${users.length}`);
    console.log("-------------------------------------------");

    console.log(`✅ LIMIT REACHED: ${limitReachedCount} Users`);
    if (limitReachedCount > 0) {
        console.log("   (Examples: " + limitReachedUsers.slice(0, 5).join(", ") + (limitReachedCount > 5 ? "..." : "") + ")");
    }

    console.log(`\n⚠️ ZERO LEADS: ${zeroLeadsCount} Users`);
    if (zeroLeadsCount > 0) {
        zeroLeadUsers.forEach(u => console.log(`   - ${u}`));
    } else {
        console.log("   🎉 Amazing! No active user is at 0 leads.");
    }

    console.log("\n-------------------------------------------");
    console.log(`📈 System Stats:`);
    console.log(`   - Leads Distributed: ${totalDistributed}`);
    console.log(`   - Total Capacity:    ${totalCapacity}`);
    console.log(`   - Utilization:       ${Math.round((totalDistributed / totalCapacity) * 100)}%`);
}

analyzeLimits();
