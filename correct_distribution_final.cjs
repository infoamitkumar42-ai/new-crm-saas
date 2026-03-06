const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log('--- REVERTING AND REDISTRIBUTING OVER-ASSIGNED LEADS ---');

    // 1. Get all leads from this bulk task
    const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .eq('source', 'Bulk-Teamfire-Feb27');

    const owners = [...new Set(leads.map(l => l.assigned_to))];
    const { data: users } = await supabase
        .from('users')
        .select('id, name, email, total_leads_promised, plan_activation_time')
        .in('id', owners);

    const leadsToReclaim = [];
    const memberNeeds = [];

    for (const user of users) {
        const activationDate = user.plan_activation_time ? new Date(user.plan_activation_time) : new Date('2026-02-01');

        // Count leads received BEFORE today's bulk injection
        const { count: receivedBeforeToday } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', user.id)
            .gte('assigned_at', activationDate.toISOString())
            .neq('source', 'Bulk-Teamfire-Feb27');

        const promised = user.total_leads_promised || 0;
        const pendingBefore = Math.max(0, promised - (receivedBeforeToday || 0));

        const myAssignedLeads = leads.filter(l => l.assigned_to === user.id);

        if (pendingBefore === 0) {
            // Reclaim everything
            leadsToReclaim.push(...myAssignedLeads.map(l => l.id));
            console.log(`Reclaiming ${myAssignedLeads.length} leads from ${user.name} (Quota already met)`);
        } else if (myAssignedLeads.length > pendingBefore) {
            // Reclaim the overflow
            const overflow = myAssignedLeads.slice(pendingBefore);
            leadsToReclaim.push(...overflow.map(l => l.id));
            console.log(`Reclaiming ${overflow.length} overflow leads from ${user.name} (Needed ${pendingBefore}, got ${myAssignedLeads.length})`);
        } else {
            const stillPending = Math.max(0, pendingBefore - myAssignedLeads.length);
            if (stillPending > 0) {
                memberNeeds.push({ id: user.id, name: user.name, pending: stillPending });
            }
        }
    }

    console.log(`\nTotal leads to redistribute: ${leadsToReclaim.length}`);

    if (leadsToReclaim.length === 0) {
        console.log('Nothing to reclaim.');
        return;
    }

    // 2. Redistribute
    console.log('--- Redistributing ---');
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

    console.log(`Mapped ${distributionMap.length} leads to members with pending quotas.`);

    // 3. Apply Updates
    for (const item of distributionMap) {
        await supabase.from('leads').update({
            assigned_to: item.memberId,
            user_id: item.memberId,
            assigned_at: new Date().toISOString()
        }).eq('id', item.leadId);
    }
    console.log('✅ Redistribution complete.');

    // 4. Cleanup any remaining leads that couldn't be assigned (no one needs leads)
    const leftOver = leadsToReclaim.slice(reclaimIdx);
    if (leftOver.length > 0) {
        console.log(`⚠️ ${leftOver.length} leads deleted as all active quotas are now full.`);
        await supabase.from('leads').delete().in('id', leftOver);
    }
}

run();
