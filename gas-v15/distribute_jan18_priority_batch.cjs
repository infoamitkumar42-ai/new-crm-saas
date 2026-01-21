
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


const SPECIFIC_MANAGER_ID = 'ff0ead1f-212c-4e89-bc81-dec4185f8853'; // Simran

async function distributeLeads() {
    console.log("🚀 Starting Priority Distribution (Zero Leads First)...\n");

    // 1. Fetch Stuck Leads
    const todayResult = new Date();
    todayResult.setHours(0, 0, 0, 0);

    // Adjust for UTC if needed, but 'New' status is the key
    const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('status', 'New')
        .gte('created_at', todayResult.toISOString())
        .order('created_at', { ascending: true }); // Oldest first

    if (leadsError) { console.error("❌ Leads Error:", leadsError); return; }
    if (!leads || leads.length === 0) { console.log("✅ No stuck leads found."); return; }

    console.log(`📦 Found ${leads.length} Stuck Leads.`);

    // 2. Fetch ALL Active Users (Global + Simran Team)
    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('is_active', true)
        .neq('plan_name', 'none');

    if (usersError) { console.error("❌ Users Error:", usersError); return; }

    // 3. Categorize Users
    const highPending = [];
    const others = [];

    users.forEach(u => {
        const uPending = (u.daily_limit || 0) - (u.leads_today || 0);
        if (uPending <= 0) return; // Full

        const uObj = { ...u, pending: uPending };

        if (uPending >= 10) {
            highPending.push(uObj);
        } else {
            others.push(uObj);
        }
    });

    // Sort High Pending by highest pending first
    highPending.sort((a, b) => b.pending - a.pending);

    // Sort Others by highest pending first
    others.sort((a, b) => b.pending - a.pending);

    const finalQueue = [...highPending, ...others];

    console.log(`👥 Distribution Queue (${finalQueue.length} Users):`);
    console.log(`   1. High Pending (>=10): ${highPending.length} users (Priority)`);
    highPending.forEach(u => console.log(`      - ${u.name} (Pending: ${u.pending})`));
    console.log(`   2. Others: ${others.length} users`);

    // 4. Distribute
    let leadIndex = 0;
    let assignedCount = 0;

    for (const user of finalQueue) {
        if (leadIndex >= leads.length) break;

        // One lead per user logic (Round Robin style for recovery)
        const toGive = 1;

        const batch = leads.slice(leadIndex, leadIndex + toGive);

        for (const lead of batch) {
            const { error: updateError } = await supabase
                .from('leads')
                .update({
                    status: 'Assigned',
                    user_id: user.id,
                    assigned_to: user.id,
                    assigned_at: new Date().toISOString()
                })
                .eq('id', lead.id);

            if (!updateError) {
                console.log(`✅ Assigned Lead ${lead.phone.slice(-4)} -> ${user.name} (Leads Today: ${user.leads_today + 1})`);
                await supabase.rpc('increment_leads_today', { user_id: user.id });
                // Update local for correctness in loop if we were doing >1
                user.leads_today += 1;
                assignedCount++;
            } else {
                console.error(`❌ Failed to assign lead ${lead.id}:`, updateError);
            }
        }

        leadIndex += toGive;
    }

    console.log(`\n🎉 Done! Assigned ${assignedCount} leads.`);
}

distributeLeads();
