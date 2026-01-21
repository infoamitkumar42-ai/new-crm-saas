
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

async function syncCounters() {
    console.log("🔄 Syncing User 'leads_today' Counters...");

    // 1. Calculate Start of Day (IST 00:00)
    // Jan 18 00:00 IST = Jan 17 18:30 UTC
    const istOffset = 5.5 * 60 * 60 * 1000;
    const now = new Date();
    const istNow = new Date(now.getTime() + istOffset);
    istNow.setUTCHours(0, 0, 0, 0);
    const startOfTodayUTC = new Date(istNow.getTime() - istOffset).toISOString();

    console.log(`📅 Counting Leads Since: ${startOfTodayUTC}`);

    // 2. Fetch Actual Assignments
    const { data: leads, error: lErr } = await supabase
        .from('leads')
        .select('assigned_to')
        .gte('created_at', startOfTodayUTC)
        .not('assigned_to', 'is', null);

    if (lErr) {
        console.error("❌ Error fetching leads:", lErr);
        return;
    }

    // 3. Aggregate Counts
    const counts = {};
    leads.forEach(l => {
        counts[l.assigned_to] = (counts[l.assigned_to] || 0) + 1;
    });

    console.log(`📊 Found assignments for ${Object.keys(counts).length} users.`);

    // 4. Fetch Active Users (to set 0 for others)
    const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, name, leads_today')
        .eq('is_active', true);

    if (uErr) {
        console.error("❌ Error fetching users:", uErr);
        return;
    }

    // 5. Update Users
    let updatedCount = 0;
    for (const u of users) {
        const correctCount = counts[u.id] || 0;

        // Only update if different
        if (u.leads_today !== correctCount) {
            const { error: updateErr } = await supabase
                .from('users')
                .update({ leads_today: correctCount })
                .eq('id', u.id);

            if (!updateErr) {
                console.log(`✅ Fixed: ${u.name.padEnd(20)} | Old: ${u.leads_today} -> New: ${correctCount}`);
                updatedCount++;
            } else {
                console.error(`❌ Failed to update ${u.name}:`, updateErr);
            }
        }
    }

    console.log(`\n🎉 Sync Complete! Updated ${updatedCount} users.`);
}

syncCounters();
