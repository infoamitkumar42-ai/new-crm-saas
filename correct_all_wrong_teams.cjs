const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log('--- STRICT RECLAMATION (TEAMFIRE ONLY) ---');

    // 1. Get all leads from this bulk task
    const { data: allBulkLeads } = await supabase
        .from('leads')
        .select('id, assigned_to')
        .eq('source', 'Bulk-Teamfire-Feb27');

    const owners = [...new Set(allBulkLeads.map(l => l.assigned_to))];
    const { data: users } = await supabase
        .from('users')
        .select('id, name, email, team_code, total_leads_promised, plan_activation_time')
        .in('id', owners);

    const wrongIds = users.filter(u => u.team_code !== 'TEAMFIRE').map(u => u.id);
    const wrongUsersNames = users.filter(u => u.team_code !== 'TEAMFIRE').map(u => `${u.name} (${u.team_code})`);

    console.log(`Found ${wrongUsersNames.length} users who got leads but are not strictly TEAMFIRE:`, wrongUsersNames);

    // 2. Identify leads to reclaim
    const leadsToReclaim = allBulkLeads.filter(l => wrongIds.includes(l.assigned_to)).map(l => l.id);

    console.log(`Reclaiming ${leadsToReclaim.length} leads in total.`);

    // 3. Find correct TEAMFIRE members (team_code = 'TEAMFIRE') and remaining quotas
    const { data: teamfireUsers } = await supabase
        .from('users')
        .select('id, name, email, total_leads_promised, plan_activation_time')
        .eq('is_active', true)
        .eq('team_code', 'TEAMFIRE');

    const memberNeeds = [];
    for (const user of teamfireUsers) {
        const activationDate = user.plan_activation_time ? new Date(user.plan_activation_time) : new Date('2026-02-01');

        // Count total leads actually assigned TODAY, effectively showing quota status
        const { count: receivedTotal } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', user.id)
            .gte('assigned_at', activationDate.toISOString());

        const promised = user.total_leads_promised || 0;
        const pending = Math.max(0, promised - (receivedTotal || 0));

        if (pending > 0) {
            memberNeeds.push({ id: user.id, name: user.name, pending });
        }
    }

    console.log(`Found ${memberNeeds.length} TeamFire members with remaining quotas.`);
    memberNeeds.forEach(m => console.log(`- ${m.name}: needs ${m.pending}`));

    if (leadsToReclaim.length === 0) {
        console.log('Nothing to reclaim.');
        return;
    }

    // 4. Redistribute
    const distributionMap = [];
    let reclaimIdx = 0;
    memberNeeds.sort((a, b) => b.pending - a.pending);

    while (reclaimIdx < leadsToReclaim.length && memberNeeds.length > 0) {
        let changed = false;
        for (const member of memberNeeds) {
            if (reclaimIdx >= leadsToReclaim.length) break;
            if (member.pending > 0) {
                distributionMap.push({
                    leadId: leadsToReclaim[reclaimIdx],
                    memberId: member.id,
                    memberName: member.name
                });
                member.pending--;
                reclaimIdx++;
                changed = true;
            }
        }
        if (!changed) break;
    }

    console.log(`\nRedistributing ${distributionMap.length} leads.`);

    // Batch Update
    const batchSize = 50;
    for (let i = 0; i < distributionMap.length; i += batchSize) {
        const batch = distributionMap.slice(i, i + batchSize);
        await Promise.all(batch.map(item => supabase.from('leads').update({
            assigned_to: item.memberId,
            user_id: item.memberId,
            assigned_at: new Date().toISOString()
        }).eq('id', item.leadId)));
    }

    // 5. Cleanup the ones left over (delete)
    const leftOver = leadsToReclaim.slice(reclaimIdx);
    if (leftOver.length > 0) {
        console.log(`Deleting ${leftOver.length} leads that cannot be assigned to true TEAMFIRE (quotas full).`);
        await supabase.from('leads').delete().in('id', leftOver);
    }

    console.log('--- FINAL REDISTRIBUTION COMPLETE ---');
}

run();
