
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

async function analyzeHistory() {
    console.log("🕰️ Analyzing Distribution History (Created Date vs Assigned Date)...");

    // Today in IST starts at Jan 17 18:30 UTC
    const todayStartUTC = '2026-01-17T18:30:00.000Z';

    // Fetch ALL leads assigned TODAY
    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, created_at, assigned_at, status')
        .gte('assigned_at', todayStartUTC);

    if (error) { console.error(error); return; }

    console.log(`\n📊 Total Leads Distributed Today (Since 12:00 AM): ${leads.length}`);

    // Group by Creation Date (IST)
    const breakdown = {};
    const dateOptions = { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'short', day: 'numeric' };

    leads.forEach(l => {
        const createdDate = new Date(l.created_at).toLocaleDateString('en-IN', dateOptions);
        breakdown[createdDate] = (breakdown[createdDate] || 0) + 1;
    });

    console.table(breakdown);

    console.log("\n🧪 Breakdown Analysis:");
    let oldLeads = 0;
    let freshLeads = 0;

    Object.entries(breakdown).forEach(([date, count]) => {
        if (date.includes("18 Jan")) {
            freshLeads += count;
        } else {
            oldLeads += count;
            console.log(`   - Backlog from ${date}: ${count} leads`);
        }
    });

    console.log(`\n📌 Summary:`);
    console.log(`   - Fresh Leads (Today): ${freshLeads}`);
    console.log(`   - Old/Backlog Cleared: ${oldLeads}`);
    if (oldLeads > 0) console.log("     (These are the 'Stuck' leads you asked about)");

}

analyzeHistory();
