
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

async function revertLeads() {
    console.log("🔙 Starting Revert Process for Leads (9 Jan - 15 Jan)...");

    // Timezone: IST is UTC+5:30
    // Start: 9 Jan 00:00 IST -> 8 Jan 18:30 UTC
    // End: 15 Jan 23:59 IST -> 15 Jan 18:29 UTC
    const startRange = '2026-01-08T18:30:00.000Z';
    const endRange = '2026-01-15T18:29:59.000Z';
    const todayAssigned = '2026-01-17T18:30:00.000Z'; // Leads assigned today

    // 1. Find Target Leads
    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, assigned_to, name')
        .gte('created_at', startRange)
        .lte('created_at', endRange)
        .gte('assigned_at', todayAssigned)
        .not('assigned_to', 'is', null);

    if (error) { console.error("❌ Error fetching:", error); return; }

    console.log(`📊 Found ${leads.length} matching leads to remove.`);

    if (leads.length === 0) {
        console.log("✅ No matching leads found in this range.");
        return;
    }

    // 2. Calculate User Refunds
    const refunds = {};
    const leadIds = leads.map(l => l.id);

    leads.forEach(l => {
        refunds[l.assigned_to] = (refunds[l.assigned_to] || 0) + 1;
    });

    console.log("📉 Quota Refunds Calculated:");
    Object.entries(refunds).forEach(([uid, count]) => {
        console.log(`   - User ${uid.substring(0, 5)}... : -${count}`);
    });

    // 3. Unassign Leads
    const { error: updateErr } = await supabase
        .from('leads')
        .update({
            assigned_to: null,
            user_id: null, // Ensure both are cleared
            status: 'Archived',
            notes: 'Reverted via Script (Old 9-15 Jan)'
        })
        .in('id', leadIds);

    if (updateErr) { console.error("❌ Failed to unassign:", updateErr); return; }

    console.log("✅ Leads Unassigned & Archived.");

    // 4. Restore User Quotas
    console.log("🔄 Restoring User Limits...");
    for (const [userId, count] of Object.entries(refunds)) {
        // Fetch current count to be safe
        const { data: user, error: uErr } = await supabase
            .from('users')
            .select('leads_today')
            .eq('id', userId)
            .single();

        if (user && !uErr) {
            const newCount = Math.max(0, user.leads_today - count); // Prevent negative
            await supabase
                .from('users')
                .update({ leads_today: newCount })
                .eq('id', userId);
            console.log(`   - Restored User ${userId}: ${user.leads_today} -> ${newCount}`);
        }
    }

    console.log("\n🎉 Revert Complete! 9-15 Jan leads removed.");
}

revertLeads();
