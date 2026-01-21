
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Setup Supabase
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

async function distributeStuckLeads() {
    console.log("🚀 Starting Force Distribution of Stuck Leads...");

    // 1. Get Stuck Leads (Status = 'New', Created Today)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    istNow.setUTCHours(0, 0, 0, 0);
    const startOfTodayUTC = new Date(istNow.getTime() - istOffset).toISOString();

    const { data: stuckLeads, error: lErr } = await supabase
        .from('leads')
        .select('*')
        .eq('status', 'New') // Only New
        .gte('created_at', startOfTodayUTC)
        .order('created_at', { ascending: true }); // Oldest first

    if (lErr || !stuckLeads || stuckLeads.length === 0) {
        console.log("✅ No stuck leads found.");
        return;
    }

    // 2. Get Eligible Users
    const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, name, email, daily_limit, leads_today, plan_name, plan_weight')
        .gt('valid_until', new Date().toISOString())
        //.eq('leads_paused', false) // Removed as column might not exist
        .order('leads_today', { ascending: true }); // Give to those with fewest leads first

    if (uErr || !users) {
        console.error("❌ Error fetching users:", uErr);
        return;
    }

    // Filter those who have capacity
    const eligibleUsers = users.filter(u => u.leads_today < u.daily_limit);

    if (eligibleUsers.length === 0) {
        console.log("❌ No active users with remaining capacity!");
        return;
    }

    console.log(`👥 Found ${eligibleUsers.length} Eligible Users with Capacity.`);

    // 3. Round Robin Distribution
    let assignedCount = 0;
    let userIndex = 0;
    const distributionReport = {};

    for (const lead of stuckLeads) {
        // Find next user with capacity
        let attempts = 0;
        let selectedUser = null;

        while (attempts < eligibleUsers.length) {
            const candidate = eligibleUsers[userIndex % eligibleUsers.length];
            if (candidate.leads_today < candidate.daily_limit) {
                selectedUser = candidate;
                break;
            }
            userIndex++;
            attempts++;
        }

        if (!selectedUser) {
            console.log("⚠️ All users reached daily limit! Stopping distribution.");
            break;
        }

        // Assign Lead
        const { error: updateErr } = await supabase
            .from('leads')
            .update({
                status: 'Assigned',
                assigned_to: selectedUser.id,
                distributed_at: new Date().toISOString()
            })
            .eq('id', lead.id);

        if (!updateErr) {
            // Update Local State
            selectedUser.leads_today++;

            // Increment DB Counter (Optimistic for script speed, but ideally RPC)
            await supabase.rpc('increment_leads_today', { user_id: selectedUser.id });

            assignedCount++;
            distributionReport[selectedUser.name] = (distributionReport[selectedUser.name] || 0) + 1;

            console.log(`✅ Assigned Lead ${lead.id.slice(0, 5)}... -> ${selectedUser.name} (${selectedUser.leads_today}/${selectedUser.daily_limit})`);

            // Move to next user for Round Robin
            userIndex++;
        } else {
            console.error(`❌ Failed to update lead ${lead.id}`);
        }
    }

    console.log(`\n🎉 Distribution Complete! Assigned ${assignedCount} leads.`);
    console.log("📊 Summary:");
    Object.keys(distributionReport).forEach(name => {
        console.log(`   - ${name.padEnd(20)}: +${distributionReport[name]}`);
    });
}

distributeStuckLeads();
