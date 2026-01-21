
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

async function checkSamanStats() {
    console.log("🕵️ Checking Saman's Lead Stats for Today...");

    // 1. Find Saman
    const { data: users } = await supabase.from('users').select('id, name, leads_today').ilike('name', '%saman%');
    const saman = users[0];

    if (!saman) { console.log("User Saman not found."); return; }
    console.log(`👤 User: ${saman.name} | Counter says: ${saman.leads_today}`);

    // 2. Fetch Leads assigned TODAY
    const todayAssigned = '2026-01-17T18:30:00.000Z';
    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, name, created_at, status')
        .eq('assigned_to', saman.id)
        .gte('assigned_at', todayAssigned);

    if (error) { console.error(error); return; }

    console.log(`📊 Total Assigned Today: ${leads.length}`);

    // 3. Analyze Age
    let freshCount = 0;
    let oldButRetainedCount = 0;

    leads.forEach(l => {
        const created = new Date(l.created_at);
        // Is it from Jan 18 (Today)?
        // UTC > Jan 17 18:30
        const isFresh = created.getTime() > new Date(todayAssigned).getTime();

        if (isFresh) {
            freshCount++;
        } else {
            oldButRetainedCount++;
            console.log(`   🔸 Older Lead: ${l.name} (Created: ${created.toLocaleDateString()})`);
        }
    });

    console.log(`\n📅 Breakdown:`);
    console.log(`   ✅ Fresh (Today): ${freshCount}`);
    console.log(`   🟧 Old (Retained): ${oldButRetainedCount} (Should be Jan 16 ideally)`);

    if (oldButRetainedCount > 0) {
        // Double check date
        console.log("   (Checking dates of older ones...)");
        leads.filter(l => new Date(l.created_at) < new Date(todayAssigned)).forEach(l => {
            console.log(`    - ${l.name}: ${new Date(l.created_at).toLocaleString()}`);
        });
    }
}

checkSamanStats();
