
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

async function checkRealTime() {
    console.log("📊 Reconciling Lead Counts (Today)...");

    const now = new Date();
    // IST Offset = +5.5 hours
    // Today 00:00 IST = Yesterday 18:30 UTC
    // Let's calculated it dynamically or hardcode for 18th
    // Jan 18 00:00 IST = Jan 17 18:30 UTC

    // Dynamic calculation:
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    istNow.setUTCHours(0, 0, 0, 0);
    const startOfTodayUTC = new Date(istNow.getTime() - istOffset).toISOString();

    console.log(`📅 Counting Leads Since: ${startOfTodayUTC} (IST 00:00 Today)`);

    // Fetch ALL leads created since then
    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, status, assigned_to, created_at, source')
        .gte('created_at', startOfTodayUTC);

    if (error) {
        console.error("❌ Error fetching leads:", error);
        return;
    }

    const total = leads.length;
    const assigned = leads.filter(l => l.assigned_to).length;
    const backlog = leads.filter(l => l.status === 'Night_Backlog').length;
    const others = total - assigned - backlog; // Maybe 'New' but not assigned?

    console.log("\n-------------------------------------------");
    console.log(`🚀 TOTAL REAL-TIME LEADS TODAY: ${total}`);
    console.log(`   (Ad Manager says ~155. Compare this: ${total})`);
    console.log("-------------------------------------------");
    console.log(`✅ Assigned/Distributed:   ${assigned}`);
    console.log(`🌙 Night Backlog (Today):  ${backlog}`);
    console.log(`⚠️ Unassigned/Other:       ${others}`);
    console.log("-------------------------------------------");

    if (others > 0) {
        console.log("Checking 'Other' Leads...");
        leads.filter(l => !l.assigned_to && l.status !== 'Night_Backlog').forEach(l => {
            console.log(`   - ${l.status} | Source: ${l.source} | Created: ${l.created_at}`);
        });
    }
}

checkRealTime();
