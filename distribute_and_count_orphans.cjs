const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    const TEAM_CODE = 'TEAMFIRE';
    const startStr = '2026-02-21T00:00:00.000+05:30';
    const endStr = '2026-02-21T23:59:59.999+05:30';

    // ===== PART 1: Distribute today's 19 Himanshu leads =====
    console.log("🚀 PART 1: Distributing today's Himanshu leads to TEAMFIRE...\n");

    // Fetch active TEAMFIRE users
    const { data: teamUsers } = await supabase
        .from('users')
        .select('id, name, plan_name, leads_today')
        .eq('team_code', TEAM_CODE)
        .eq('is_active', true)
        .order('leads_today', { ascending: true });

    console.log(`Active TEAMFIRE Users: ${teamUsers.length}`);

    // Fetch today's unassigned Himanshu leads
    let allLeads = [];
    let hasMore = true;
    let page = 0;
    while (hasMore) {
        const { data: leads, error } = await supabase
            .from('leads')
            .select('id, name, source, assigned_to, status')
            .ilike('source', '%Himanshu%')
            .gte('created_at', startStr)
            .lte('created_at', endStr)
            .range(page * 1000, (page + 1) * 1000 - 1);
        if (error) { console.error("Error:", error.message); return; }
        allLeads = allLeads.concat(leads);
        hasMore = leads.length === 1000;
        page++;
    }

    const unassigned = allLeads.filter(l =>
        !l.assigned_to || l.assigned_to.trim() === '' || l.status === 'Unassigned'
    );

    console.log(`Today's Himanshu Leads: ${allLeads.length} (Unassigned: ${unassigned.length})`);

    if (unassigned.length > 0 && teamUsers.length > 0) {
        const now = new Date().toISOString();
        let userIndex = 0;
        const assignedCounts = {};

        for (let lead of unassigned) {
            const user = teamUsers[userIndex % teamUsers.length];
            await supabase.from('leads').update({
                assigned_to: user.id, user_id: user.id,
                status: 'Assigned', assigned_at: now
            }).eq('id', lead.id);

            assignedCounts[user.id] = (assignedCounts[user.id] || 0) + 1;
            await supabase.from('notifications').insert({
                user_id: user.id,
                title: 'New Lead Assigned',
                message: `Lead: ${lead.name || 'Unknown'} has been assigned to you.`,
                type: 'lead_assignment'
            });
            userIndex++;
        }

        console.log(`\n✅ Distributed ${unassigned.length} leads to ${Math.min(unassigned.length, teamUsers.length)} users.`);

        // Update leads_today
        for (let u of teamUsers) {
            if (assignedCounts[u.id] > 0) {
                const newTotal = (u.leads_today || 0) + assignedCounts[u.id];
                await supabase.from('users').update({ leads_today: newTotal }).eq('id', u.id);
                console.log(` - ${u.name}: +${assignedCounts[u.id]} -> Total today: ${newTotal}`);
            }
        }
    } else {
        console.log("No unassigned leads to distribute or no active users.");
    }

    // ===== PART 2: Count ALL orphan/unassigned leads in the ENTIRE system =====
    console.log("\n\n📊 PART 2: Counting ALL Unassigned/Orphan Leads in Entire System...\n");

    // Method: count leads where assigned_to is null OR status is 'Unassigned'
    const { count: nullAssigned } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .is('assigned_to', null);

    const { count: statusUnassigned } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Unassigned');

    // Also count by source to see where these orphans came from
    const { data: orphanLeads } = await supabase
        .from('leads')
        .select('source')
        .is('assigned_to', null);

    const sourceBreakdown = {};
    if (orphanLeads) {
        orphanLeads.forEach(l => {
            const src = l.source || 'Unknown';
            sourceBreakdown[src] = (sourceBreakdown[src] || 0) + 1;
        });
    }

    // Total leads in system
    const { count: totalSystemLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });

    console.log(`Total Leads in Entire System: ${totalSystemLeads}`);
    console.log(`Leads with assigned_to = NULL: ${nullAssigned}`);
    console.log(`Leads with status = 'Unassigned': ${statusUnassigned}`);
    console.log(`\nOrphan Leads by Source:`);
    Object.entries(sourceBreakdown).sort((a, b) => b[1] - a[1]).forEach(([src, count]) => {
        console.log(`  - ${src}: ${count}`);
    });
}

main().catch(console.error);
