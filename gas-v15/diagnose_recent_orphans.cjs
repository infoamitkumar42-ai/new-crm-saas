
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

async function diagnoseOrphans() {
    console.log("🔍 Diagnosing Recent 17 Orphans...");

    // Fetch leads created after 10:20 AM today
    const startTime = new Date();
    startTime.setHours(10, 20, 0, 0); // 10:20 AM local estimated (or just recent)
    // Actually, let's just grab the last 20 leads that are 'New'

    const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .eq('status', 'New')
        .is('user_id', null)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) { console.error(error); return; }

    console.log(`📋 Found ${leads.length} leads stuck in 'New'.`);

    if (leads.length > 0) {
        console.log("   Most Recent:");
        leads.forEach(l => {
            console.log(`   - ID: ${l.id} | Name: ${l.name} | Created: ${new Date(l.created_at).toLocaleString()} | Source: ${l.source}`);
            // Check if any error notes?
            if (l.notes) console.log(`     Notes: ${l.notes}`);
        });
    }

    // Check System Health for assignment
    // Are there eligible users?
    const { data: users } = await supabase
        .from('users')
        .select('id, name, leads_today, daily_limit')
        .eq('is_active', true)
        .gt('daily_limit', 0);

    const eligible = users.filter(u => u.leads_today < u.daily_limit);
    console.log(`\n👥 Eligible Users Available: ${eligible.length} / ${users.length} Active Users`);

    if (eligible.length === 0) {
        console.log("⚠️ ROOT CAUSE: NO ELIGIBLE USERS! Everyone is full.");
    } else {
        console.log("✅ Users have capacity. Issue is likely Code/Webhook failure.");
    }
}

diagnoseOrphans();
