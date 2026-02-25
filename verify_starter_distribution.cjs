const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const TARGET_SOURCES = [
    'Meta - Digital Skills India - By Himanshu Sharma',
    'Meta - Rajwinder FB Page 2',
    'Meta - Work With Himanshu Sharma',
    'new year ad himanshu 7/1/26'
];

async function main() {
    // Get leads we just assigned today from these sources
    const { data: leads } = await supabase.from('leads')
        .select('assigned_to')
        .in('source', TARGET_SOURCES)
        .gte('assigned_at', '2026-02-21T18:30:00.000Z') // 'Today' IST
        .not('assigned_to', 'is', null);

    if (!leads || leads.length === 0) {
        console.log("No leads found.");
        return;
    }

    const assignedUserIds = [...new Set(leads.map(l => l.assigned_to))];

    // Get the users and their plans
    const { data: users } = await supabase.from('users')
        .select('id, name, plan_name')
        .in('id', assignedUserIds);

    const planCounts = {
        'starter': { users: 0, totalLeads: 0 },
        'supervisor': { users: 0, totalLeads: 0 },
        'manager': { users: 0, totalLeads: 0 },
        'weekly_boost': { users: 0, totalLeads: 0 },
        'turbo_boost': { users: 0, totalLeads: 0 },
        'none/other': { users: 0, totalLeads: 0 }
    };

    const userMap = {};
    users.forEach(u => {
        const plan = (u.plan_name || 'none/other').toLowerCase();
        userMap[u.id] = plan;
        if (!planCounts[plan]) planCounts[plan] = { users: 0, totalLeads: 0 };
        planCounts[plan].users++;
    });

    leads.forEach(l => {
        const plan = userMap[l.assigned_to] || 'none/other';
        if (planCounts[plan]) {
            planCounts[plan].totalLeads++;
        }
    });

    console.log(`=== PLAN DISTRIBUTION BREAKDOWN FOR ${leads.length} LEADS ===`);
    Object.entries(planCounts).forEach(([plan, data]) => {
        if (data.users > 0) {
            console.log(`- ${plan.toUpperCase()}: ${data.users} users received a total of ${data.totalLeads} leads`);
        }
    });
}

main().catch(console.error);
