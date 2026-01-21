
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

async function diagnoseRajinder() {
    console.log("🕵️‍♂️ Diagnosing Rajinder's Status...");

    // 1. Fetch Full User Details
    const { data: users, error: uErr } = await supabase
        .from('users')
        .select('*') // Get everything to see hidden flags
        .ilike('name', '%Rajinder%')
        .limit(1);

    if (uErr || !users || users.length === 0) {
        console.log("❌ User 'Rajinder' not found!");
        return;
    }

    const u = users[0];
    console.log("\n👤 USER DETAILS:");
    console.log(`   Name: ${u.name}`);
    console.log(`   Email: ${u.email}`);
    console.log(`   Plan: ${u.plan_name}`);
    console.log(`   Daily Limit: ${u.daily_limit}`);
    console.log(`   Leads Today: ${u.leads_today}`);
    console.log(`   Valid Until: ${u.valid_until}`);
    console.log(`   Created At: ${u.created_at}`);

    console.log("\n🛑 STATUS CHECK:");
    console.log(`   Leads Paused? : ${u.leads_paused ? 'YES (🔴 PAUSED)' : 'NO (🟢 ACTIVE)'}`);
    console.log(`   Last Active At: ${u.last_active_at || 'Never'}`);
    console.log(`   Last Lead Time: ${u.last_lead_assigned_at || 'Never'}`);

    // Check if valid_until is in past?
    const validUntil = new Date(u.valid_until);
    const now = new Date();
    if (validUntil < now) {
        console.log(`   Expired?      : YES 🔴 (Plan Expired on ${validUntil.toLocaleString()})`);
    } else {
        console.log(`   Expired?      : NO 🟢 (Valid until ${validUntil.toLocaleString()})`);
    }

    // Check recent leads to see gaps
    const { data: leads } = await supabase
        .from('leads')
        .select('created_at')
        .eq('assigned_to', u.id)
        .order('created_at', { ascending: false });

    console.log("\n📅 LEAD HISTORY:");
    if (leads && leads.length > 0) {
        leads.forEach(l => console.log(`   - ${new Date(l.created_at).toLocaleString()}`));
    } else {
        console.log("   No leads found.");
    }
}

diagnoseRajinder();
