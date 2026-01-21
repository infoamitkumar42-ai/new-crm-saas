
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

async function checkRajinder() {
    console.log("🔍 Checking leads for 'Rajinder'...");

    // 1. Find User ID
    const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, name, email, plan_name, daily_limit, valid_until, created_at')
        .ilike('name', '%Rajinder%');

    if (uErr || !users || users.length === 0) {
        console.log("❌ User 'Rajinder' not found!");
        return;
    }

    const user = users[0];
    console.log(`👤 Found User: ${user.name} (${user.email})`);
    console.log(`   Plan: ${user.plan_name} | Daily Limit: ${user.daily_limit}`);
    console.log(`   Account Created: ${user.created_at}`);

    // 2. Count Leads
    const { data: leads, error: lErr } = await supabase
        .from('leads')
        .select('*')
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false });

    if (lErr) {
        console.error("❌ Error fetching leads:", lErr);
        return;
    }

    console.log(`\n📋 Total Leads Assigned: ${leads.length}`);
    console.log("-----------------------------------------");
    leads.forEach((l, i) => {
        console.log(`${i + 1}. ${l.name} (${l.phone}) - ${new Date(l.created_at).toLocaleString()}`);
    });
    console.log("-----------------------------------------");
}

checkRajinder();
