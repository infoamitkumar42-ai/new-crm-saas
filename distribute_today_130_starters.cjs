const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    console.log("🚀 Starting assignment of TODAY's 130 Orphan Leads to Starter users in TEAMFIRE...");

    const TEAM_CODE = 'TEAMFIRE';
    const TARGET_PLAN = 'starter';
    const TODAY_STR = '2026-02-20';

    // 1. Fetch eligible Starter users in TEAMFIRE
    const { data: teamUsers, error: tErr } = await supabase
        .from('users')
        .select('id, name, plan_name, is_active, leads_today')
        .eq('team_code', TEAM_CODE)
        .eq('is_active', true)
        .ilike('plan_name', `%${TARGET_PLAN}%`);

    if (tErr) {
        console.error("Error fetching users:", tErr.message);
        return;
    }

    if (!teamUsers || teamUsers.length === 0) {
        console.log(`❌ No active users with plan '${TARGET_PLAN}' found in team '${TEAM_CODE}'. Cannot distribute.`);
        return;
    }

    console.log(`\n✅ Found ${teamUsers.length} Active Starter users in ${TEAM_CODE}:`);
    teamUsers.forEach(u => console.log(` - ${u.name} (leads_today: ${u.leads_today})`));

    // 2. Fetch today's exact 130 unassigned leads
    const todayStart = `${TODAY_STR}T00:00:00.000Z`;
    const todayEnd = `${TODAY_STR}T23:59:59.999Z`;

    let allLeads = [];
    let hasMore = true;
    let page = 0;
    const pageSize = 1000;

    while (hasMore) {
        const { data: leads, error } = await supabase
            .from('leads')
            .select('id, created_at, source, assigned_to, status, name')
            .ilike('source', '%Himanshu%')
            .gte('created_at', todayStart)
            .lte('created_at', todayEnd)
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error("Error fetching leads:", error.message);
            return;
        }

        allLeads = allLeads.concat(leads);
        hasMore = leads.length === pageSize;
        page++;
    }

    const unassignedLeads = allLeads.filter(l =>
        !l.assigned_to ||
        l.assigned_to.trim() === '' ||
        l.assigned_to.toLowerCase() === 'unassigned' ||
        l.status === 'Unassigned'
    );

    console.log(`\n📥 Fetching Unassigned Leads from Today: Found ${unassignedLeads.length} leads.`);

    if (unassignedLeads.length === 0) {
        console.log("❌ No leads to distribute.");
        return;
    }

    // 3. Round Robin Distribution
    console.log(`\n🔄 Beginning Distribution...`);
    const now = new Date().toISOString();
    let userIndex = 0;
    const assignedCounts = {};

    for (let lead of unassignedLeads) {
        let assigned = false;
        // Try to assign the lead. If a user is inactive, we might have skipped but we filtered is_active already.
        const user = teamUsers[userIndex % teamUsers.length];

        const updateData = {
            assigned_to: user.id,
            user_id: user.id,
            status: 'Assigned',
            assigned_at: now
            // Not updating created_at because we want it to reflect actual generation date (today already)
        };

        const { error: updErr } = await supabase
            .from('leads')
            .update(updateData)
            .eq('id', lead.id);

        if (updErr) {
            console.error(`❌ Error updating lead ${lead.id}:`, updErr.message);
        } else {
            // Track local stats
            assignedCounts[user.id] = (assignedCounts[user.id] || 0) + 1;
            user.leads_today += 1;
            assigned = true;

            // Insert Notification silently
            await supabase.from('notifications').insert({
                user_id: user.id,
                title: 'New Himanshu Meta Lead Assigned',
                message: `Today's Orphan Lead: ${lead.name || 'Unknown'} has been assigned to you.`,
                type: 'lead_assignment'
            });
        }

        if (assigned) {
            userIndex++; // Move to next user only if successfully assigned
        }
    }

    console.log(`\n✅ Database Update Complete. Updating leads_today counts...`);

    // 4. Update the actual users table leads_today
    for (let u of teamUsers) {
        if (assignedCounts[u.id] > 0) {
            const { error: cntErr } = await supabase
                .from('users')
                .update({ leads_today: u.leads_today })
                .eq('id', u.id);

            if (cntErr) {
                console.error(`❌ Failed to update total leads_today for ${u.name}: ${cntErr.message}`);
            } else {
                console.log(` - Updated ${u.name}: received +${assignedCounts[u.id]} leads -> Total today: ${u.leads_today}`);
            }
        }
    }

    console.log("\n🎉 Assignment Operation Complete!");
}

main().catch(console.error);
