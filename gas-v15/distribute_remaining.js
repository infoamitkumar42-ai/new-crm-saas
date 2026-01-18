import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PLAN_PRIORITY = {
    'turbo_boost': 1,
    'weekly_boost': 1,
    'manager': 2,
    'supervisor': 3,
    'starter': 4
};

async function distributeRemainingLeads() {
    console.log('\n🔄 --- DISTRIBUTING REMAINING 12 LEADS ---\n');

    const today = new Date().toISOString().split('T')[0];
    const todayStart = `${today}T00:00:00.000Z`;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const now = new Date();

    // Get remaining unassigned leads
    const { data: remainingLeads } = await supabase
        .from('leads')
        .select('*')
        .gte('created_at', todayStart)
        .is('user_id', null)
        .order('created_at', { ascending: true });

    console.log(`📍 Found ${remainingLeads.length} unassigned leads`);

    // Get All India users who are eligible
    const { data: users } = await supabase
        .from('users')
        .select('id, name, plan_name, leads_today, daily_limit, target_state, valid_until, last_activity')
        .eq('is_active', true)
        .neq('plan_name', 'none')
        .gt('daily_limit', 0);

    const allIndiaUsers = users.filter(u => {
        const validUntil = u.valid_until ? new Date(u.valid_until) : null;
        const lastActivity = u.last_activity ? new Date(u.last_activity) : null;
        const targetState = (u.target_state || '').toLowerCase();

        return (
            (targetState === 'all india' || targetState === '' || !u.target_state) &&
            u.leads_today < u.daily_limit &&
            validUntil && validUntil > now &&
            lastActivity && lastActivity > sevenDaysAgo
        );
    });

    allIndiaUsers.sort((a, b) => {
        const priorityA = PLAN_PRIORITY[a.plan_name?.toLowerCase()] || 5;
        const priorityB = PLAN_PRIORITY[b.plan_name?.toLowerCase()] || 5;
        if (priorityA !== priorityB) return priorityA - priorityB;
        return (a.leads_today || 0) - (b.leads_today || 0);
    });

    console.log(`👥 ${allIndiaUsers.length} All India users available\n`);

    let distributed = 0;
    let userIndex = 0;
    const userLeadsCount = new Map(allIndiaUsers.map(u => [u.id, u.leads_today]));

    for (const lead of remainingLeads) {
        let assigned = false;
        const startIndex = userIndex;

        do {
            const user = allIndiaUsers[userIndex];
            const currentCount = userLeadsCount.get(user.id) || 0;

            if (currentCount < user.daily_limit) {
                const { error: updateError } = await supabase
                    .from('leads')
                    .update({
                        user_id: user.id,
                        assigned_to: user.id,
                        status: 'Assigned',
                        assigned_at: new Date().toISOString(),
                        source: `${lead.source} [All India Distribution]`
                    })
                    .eq('id', lead.id);

                if (!updateError) {
                    userLeadsCount.set(user.id, currentCount + 1);
                    console.log(`✅ ${lead.name} (${lead.city}) → ${user.name} (${currentCount + 1}/${user.daily_limit})`);
                    distributed++;
                    assigned = true;

                    await supabase
                        .from('users')
                        .update({ leads_today: currentCount + 1 })
                        .eq('id', user.id);
                }
            }

            userIndex = (userIndex + 1) % allIndiaUsers.length;
        } while (!assigned && userIndex !== startIndex);

        if (!assigned) {
            console.log(`⚠️ Could not assign: ${lead.name} - All users at capacity`);
        }
    }

    console.log(`\n✅ FINAL DISTRIBUTION: ${distributed}/${remainingLeads.length} leads assigned`);
}

distributeRemainingLeads();
