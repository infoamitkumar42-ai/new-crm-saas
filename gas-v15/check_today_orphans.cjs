
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

async function checkTodayStuck() {
    console.log("🔍 Checking Today's Stuck Leads (Read-Only)...");

    // Today IST Start = Jan 17 18:30 UTC
    const todayStart = '2026-01-17T18:30:00.000Z';

    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, name, created_at, status, source')
        .eq('status', 'New')
        .gte('created_at', todayStart);

    if (error) { console.error(error); return; }

    console.log(`\n📊 Stuck Leads Snapshot (Today):`);
    console.log(`   - Count: ${leads.length}`);

    if (leads.length > 0) {
        console.log("\n   Details:");
        leads.forEach(l => {
            console.log(`   - ${l.name} (${new Date(l.created_at).toLocaleTimeString()}) - Source: ${l.source}`);
        });
    } else {
        console.log("   ✅ Zero. All leads from today are successfully distributed.");
    }
}

checkTodayStuck();
