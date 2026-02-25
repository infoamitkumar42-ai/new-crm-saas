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
    console.log("🚀 Starting distribution of Today's (Feb 21) 13 Chirag Leads...\n");

    const TEAM_CODE = 'GJ01TEAMFIRE';

    // Bounds for today (Feb 21st, IST)
    const startStr = '2026-02-21T00:00:00.000+05:30';
    const endStr = '2026-02-21T23:59:59.999+05:30';

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

    // 2. Fetch today's exact leads from Chirag
    let allLeads = [];
    let hasMore = true;
    let page = 0;

    while (hasMore) {
        const { data: leads, error } = await supabase
            .from('leads')
            .select('id, created_at, source, assigned_to, status, name')
            .ilike('source', '%Chirag%')
            .gte('created_at', startStr)
            .lte('created_at', endStr)
            .range(page * 1000, (page + 1) * 1000 - 1);

        if (error) {
            console.error("Error fetching leads:", error.message);
            return;
        }

        allLeads = allLeads.concat(leads);
        hasMore = leads.length === 1000;
        page++;
    }

    // Get strictly unassigned ones
    const unassignedLeads = allLeads.filter(l =>
        !l.assigned_to ||
        l.assigned_to.trim() === '' ||
        l.assigned_to.toLowerCase() === 'unassigned' ||
        l.status === 'Unassigned'
    );

    console.log(`📥 Total Leads from Chirag Today: ${allLeads.length}`);
    console.log(`📥 Total UNASSIGNED Leads ready for distribution: ${unassignedLeads.length}\n`);

    if (unassignedLeads.length === 0) {
        console.log("❌ No currently unassigned leads to distribute.");
        return;
    }

    console.log(`✅ Distributing to ${eligibleUsers.length} Eligible Users with Pending Quota in ${TEAM_CODE}...\n`);

    // 3. Round Robin Distribution with Limit Check
    const now = new Date().toISOString();
    let userIndex = 0;
    const assignedCounts = {};

    for (let lead of unassignedLeads) {
        let startIdx = userIndex;
        let userAssigned = null;

        while (true) {
            const potentialUser = eligibleUsers[userIndex % eligibleUsers.length];
            const limit = PLAN_LIMITS[potentialUser.plan_name] || 9999;
            const totalForUser = (potentialUser.leads_today || 0) + (assignedCounts[potentialUser.id] || 0);

            if (totalForUser < limit) {
                userAssigned = potentialUser;
                break;
            } else {
                userIndex++;
                if (userIndex % eligibleUsers.length === startIdx % eligibleUsers.length) {
                    console.log("\n⚠️ All eligible users have reached their maximum plan limits! Stopping distribution early.");
                    break;
                }
            }
        }

        if (!userAssigned) {
            break;
        }

        const updateData = {
            assigned_to: userAssigned.id,
            user_id: userAssigned.id,
            status: 'Assigned',
            assigned_at: now
        };

        const { error: updErr } = await supabase
            .from('leads')
            .update(updateData)
            .eq('id', lead.id);

        if (updErr) {
            console.error(`❌ Error updating lead ${lead.id}:`, updErr.message);
        } else {
            assignedCounts[userAssigned.id] = (assignedCounts[userAssigned.id] || 0) + 1;

            await supabase.from('notifications').insert({
                user_id: userAssigned.id,
                title: 'New Chirag Meta Lead Assigned',
                message: `Lead: ${lead.name || 'Unknown'} has been assigned to you.`,
                type: 'lead_assignment'
            });

            userIndex++;
        }
    }

    console.log(`\n✅ Database Update Complete. Updating leads_today counts...`);

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
