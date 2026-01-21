
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

async function proposeRevert() {
    console.log("🛑 Analyzing 'Old' Leads Distributed Today for Potential Revert...");

    // Old cutoff: Any lead created BEFORE Jan 17 00:00 IST
    // Jan 17 00:00 IST = Jan 16 18:30 UTC
    // Actually, user mentioned "14, 15, 9, 11". Effectively anything before Jan 17 is 'Old' for this context.
    const cutoffDate = '2026-01-16T18:30:00.000Z';
    const assignedSince = '2026-01-17T18:30:00.000Z'; // Today

    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, name, created_at, assigned_to, users!leads_assigned_to_fkey(name)')
        .lt('created_at', cutoffDate)    // Old Creation
        .gte('assigned_at', assignedSince) // Assigned Today
        .not('assigned_to', 'is', null);

    if (error) { console.error(error); return; }

    console.log(`\n📊 Found ${leads.length} OLD leads assigned today.`);

    if (leads.length === 0) {
        console.log("✅ No old leads found assigned today.");
        return;
    }

    // Group by User
    const userImpact = {};
    leads.forEach(l => {
        const userName = l.users?.name || 'Unknown';
        userImpact[userName] = (userImpact[userName] || 0) + 1;
    });

    console.log("\n👥 Impact Breakdown (Who got Trash Leads):");
    const sorted = Object.entries(userImpact).sort((a, b) => b[1] - a[1]);

    sorted.forEach(([name, count]) => {
        console.log(`   - ${name.padEnd(20)} : +${count} Old Leads`);
    });

    console.log("\n💡 PROPOSAL:");
    console.log("1. Unassign these leads (Set user_id = null, status = 'Archived' or 'Old_Backlog')");
    console.log("2. Decrement 'leads_today' count for these users.");
    console.log("   (e.g., If Saman got 14 and 10 were old, Saman drops to 4/12, eligible for NEW leads)");
}

proposeRevert();
