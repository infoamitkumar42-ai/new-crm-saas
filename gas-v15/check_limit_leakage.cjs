
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

async function checkLeakage() {
    console.log("🛡️ Checking for Limit Leakage (Assignments to Full Users)...");

    // 1. Get recent assignments (Last 30 mins)
    // To see if users who are ALREADY full got a lead recently
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60000).toISOString();

    const { data: recentLeads, error: lErr } = await supabase
        .from('leads')
        .select('id, assigned_to, created_at, name')
        .gte('assigned_at', thirtyMinsAgo);

    if (lErr) { console.error(lErr); return; }

    // 2. Get Users limit status
    const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, name, leads_today, daily_limit');

    if (uErr) { console.error(uErr); return; }

    const userMap = {};
    users.forEach(u => userMap[u.id] = u);

    let leakageFound = 0;

    console.log(`🔍 Analyzed ${recentLeads.length} leads assigned in last 30 mins.`);

    recentLeads.forEach(lead => {
        const user = userMap[lead.assigned_to];
        if (!user) return; // Unknown user??

        // Logic: If user has 8 leads now, and limit is 7.
        // And they got a lead 5 mins ago. 
        // Did they have 7 BEFORE this lead? 
        // Yes, likely.

        if (user.leads_today > user.daily_limit) {
            console.log(`⚠️ POTENTIAL LEAK: Lead assigned to ${user.name} who is OVER limit (${user.leads_today}/${user.daily_limit})`);
            console.log(`   - Lead: ${lead.name} at ${new Date(lead.created_at).toLocaleTimeString()}`);
            leakageFound++;
        }
    });

    console.log("\n-------------------------------------------");
    if (leakageFound === 0) {
        console.log("✅ SYSTEM SECURE: No leads assigned to users who are strictly defined as full.");
        console.log("(Note: Users might be effectively full now, but were eligible momentarily)");
    } else {
        console.log(`❌ WARNING: ${leakageFound} assignments detected to over-limit users.`);
        console.log("   Reason: Likely 'Manual Batch' script pushed them over, OR racing condition.");
    }

    // 3. Final Check: is anyone RECEIVING leads RIGHT NOW (last 5 mins) if full?
    // Filter strict recent
    const fiveMinsAgo = new Date(Date.now() - 5 * 60000).toISOString();
    const veryRecent = recentLeads.filter(l => l.created_at > fiveMinsAgo);

    console.log(`\n🕒 Very Recent Check (Last 5 mins): ${veryRecent.length} Leads`);
    veryRecent.forEach(lead => {
        const user = userMap[lead.assigned_to];
        console.log(`   - ${lead.name} -> ${user.name} (Current: ${user.leads_today}/${user.daily_limit})`);
    });

}

checkLeakage();
