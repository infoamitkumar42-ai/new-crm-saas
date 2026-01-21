
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

async function checkOrphans() {
    console.log("🔍 Scanning for Any Remaining Orphan Leads (Jan 15 - Present)...");

    const jan15 = new Date('2026-01-15T00:00:00Z').toISOString();

    const { data: orphans, error } = await supabase
        .from('leads')
        .select('id, created_at, status, name')
        .is('user_id', null)
        .gte('created_at', jan15);

    if (error) {
        console.error("❌ Error fetching orphans:", error);
        return;
    }

    const count = orphans.length;
    console.log(`\n📊 Total Unassigned Leads found: ${count}`);

    if (count > 0) {
        console.log("   Status Breakdown:");
        const statusMap = {};
        orphans.forEach(l => {
            statusMap[l.status] = (statusMap[l.status] || 0) + 1;
        });
        console.table(statusMap);

        console.log("\n   Sample Orphans:");
        orphans.slice(0, 5).forEach(o => console.log(`   - ${o.name} (${o.status}) - ${new Date(o.created_at).toLocaleString()}`));
    } else {
        console.log("✅ CLEAN: No orphan leads found. All leads since Jan 15 have been assigned.");
    }
}

checkOrphans();
