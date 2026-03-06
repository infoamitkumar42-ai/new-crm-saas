const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log('--- Analyzing Distribution Mistakes ---');

    // 1. Get leads assigned today with the bulk source tag
    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, assigned_to, name, phone')
        .eq('source', 'Bulk-Teamfire-Feb27');

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Total leads assigned in bulk: ${leads.length}`);

    // 2. Identify owners of these leads and their quota status
    const owners = [...new Set(leads.map(l => l.assigned_to))];
    const { data: users } = await supabase
        .from('users')
        .select('id, name, email, total_leads_promised, plan_activation_time')
        .in('id', owners);

    const report = [];
    for (const user of users) {
        const activationDate = user.plan_activation_time ? new Date(user.plan_activation_time) : new Date('2026-02-01');

        // Count total leads excluding today's bulk injection to see status PRIOR to my mistake
        const { count: receivedBeforeToday } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', user.id)
            .gte('assigned_at', activationDate.toISOString())
            .neq('source', 'Bulk-Teamfire-Feb27');

        const assignedToday = leads.filter(l => l.assigned_to === user.id).length;
        const promised = user.total_leads_promised || 0;
        const pendingBefore = Math.max(0, promised - (receivedBeforeToday || 0));

        report.push({
            name: user.name,
            email: user.email,
            id: user.id,
            promised,
            receivedSinceActivation: (receivedBeforeToday || 0) + assignedToday,
            pendingBeforeThisTask: pendingBefore,
            assignedInThisTask: assignedToday,
            shouldHaveReceived: pendingBefore > 0 ? true : false
        });
    }

    console.log('--- USER QUOTA STATUS (Pre-Assignment) ---');
    const overAssigned = report.filter(r => r.pendingBeforeThisTask === 0);
    console.log(`Members who already completed their quota but got leads: ${overAssigned.length}`);
    overAssigned.forEach(o => console.log(`- ${o.name} (${o.email}): 0 Pending, got ${o.assignedInThisTask}`));

    console.log('\n--- Members with valid pending quotas ---');
    const valid = report.filter(r => r.pendingBeforeThisTask > 0);
    valid.forEach(v => console.log(`- ${v.name} (${v.email}): ${v.pendingBeforeThisTask} Pending, got ${v.assignedInThisTask}`));
}

check();
