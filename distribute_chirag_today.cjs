const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const PLAN_LIMITS = {
    'starter': 50,
    'weekly_boost': 100,
    'manager': 200,
    'supervisor': 150,
    'turbo_boost': 250
};

async function main() {
    console.log("🚀 Starting distribution of Chirag's Unassigned Leads...\n");

    const TEAM_CODE = 'GJ01TEAMFIRE';
    const TODAY_STR = '2026-02-20';
    const todayStart = `${TODAY_STR}T00:00:00.000Z`;
    const todayEnd = `${TODAY_STR}T23:59:59.999Z`;

    // 1. Fetch eligible active TEAMFIRE users
    const { data: teamUsers, error: tErr } = await supabase
        .from('users')
        .select('id, name, email, plan_name, is_active, leads_today')
        .eq('team_code', TEAM_CODE)
        .eq('is_active', true);

    if (tErr) {
        console.error("Error fetching users:", tErr.message);
        return;
    }

    // Filter to those under their limit
    let eligibleUsers = teamUsers.filter(u => {
        const limit = PLAN_LIMITS[u.plan_name] || 9999;
        return (u.leads_today || 0) < limit;
    });

    if (eligibleUsers.length === 0) {
        console.log(`❌ No active users with pending quota found in team '${TEAM_CODE}'. Cannot distribute.`);
        return;
    }

    console.log(`✅ Found ${eligibleUsers.length} Eligible Users with Pending Quota in ${TEAM_CODE}:`);
    eligibleUsers.forEach(u => console.log(` - ${u.name} (Plan: ${u.plan_name}, Current Leads: ${u.leads_today})`));

    // 2. Fetch today's exact unassigned leads from Chirag
    let allLeads = [];
    let hasMore = true;
    let page = 0;

    while (hasMore) {
        const { data: leads, error } = await supabase
            .from('leads')
            .select('id, created_at, source, assigned_to, status, name')
            .ilike('source', '%Chirag%')
            .gte('created_at', todayStart)
            .lte('created_at', todayEnd)
            .range(page * 1000, (page + 1) * 1000 - 1);

        if (error) {
            console.error("Error fetching leads:", error.message);
            return;
        }

        allLeads = allLeads.concat(leads);
        hasMore = leads.length === 1000;
        page++;
    }

    const unassignedLeads = allLeads.filter(l =>
        !l.assigned_to ||
        l.assigned_to.trim() === '' ||
        l.assigned_to.toLowerCase() === 'unassigned' ||
        l.status === 'Unassigned'
    );

    console.log(`\n📥 Found ${unassignedLeads.length} Unassigned Leads from Chirag's page today.`);

    if (unassignedLeads.length === 0) {
        console.log("❌ No leads to distribute.");
        return;
    }

    // 3. Round Robin Distribution with Limit Check
    console.log(`\n🔄 Beginning Distribution...`);
    const now = new Date().toISOString();
    let userIndex = 0;
    const assignedCounts = {};

    for (let lead of unassignedLeads) {
        // Find next eligible user
        let startIdx = userIndex;
        let userAssigned = null;

        while (true) {
            const potentialUser = eligibleUsers[userIndex % eligibleUsers.length];
            const limit = PLAN_LIMITS[potentialUser.plan_name] || 9999;
            // Total so far today = original + what we just gave them
            const totalForUser = (potentialUser.leads_today || 0) + (assignedCounts[potentialUser.id] || 0);

            if (totalForUser < limit) {
                userAssigned = potentialUser;
                break; // Found one
            } else {
                // If they hit the limit, move to next
                userIndex++;
                if (userIndex % eligibleUsers.length === startIdx % eligibleUsers.length) {
                    // Looped through everyone, all limits reached
                    console.log("\n⚠️ All eligible users have reached their maximum plan limits! Stopping distribution early.");
                    break;
                }
            }
        }

        if (!userAssigned) {
            break; // Stop assigning, all limits reached
        }

        const updateData = {
            assigned_to: userAssigned.id,
            user_id: userAssigned.id,
            status: 'Assigned',
            assigned_at: now
            // Not updating created_at because we want it to reflect actual generation date
        };

        const { error: updErr } = await supabase
            .from('leads')
            .update(updateData)
            .eq('id', lead.id);

        if (updErr) {
            console.error(`❌ Error updating lead ${lead.id}:`, updErr.message);
        } else {
            assignedCounts[userAssigned.id] = (assignedCounts[userAssigned.id] || 0) + 1;

            // Insert Notification silently
            await supabase.from('notifications').insert({
                user_id: userAssigned.id,
                title: 'New Chirag Meta Lead Assigned',
                message: `Lead: ${lead.name || 'Unknown'} has been assigned to you.`,
                type: 'lead_assignment'
            });

            // Move pointer exactly one forward naturally so it's round-robin
            userIndex++;
        }
    }

    console.log(`\n✅ Database Update Complete. Updating leads_today counts...`);

    // 4. Update the actual users table leads_today
    for (let u of eligibleUsers) {
        if (assignedCounts[u.id] > 0) {
            const newTotal = (u.leads_today || 0) + assignedCounts[u.id];
            const { error: cntErr } = await supabase
                .from('users')
                .update({ leads_today: newTotal })
                .eq('id', u.id);

            if (cntErr) {
                console.error(`❌ Failed to update total leads_today for ${u.name}: ${cntErr.message}`);
            } else {
                console.log(` - Updated ${u.name}: received +${assignedCounts[u.id]} leads -> Total today: ${newTotal}`);
            }
        }
    }

    console.log("\n🎉 Assignment Operation Complete!");
}

main().catch(console.error);
