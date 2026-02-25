const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log(`--- 🕵️‍♂️ CHECKING 0-LEAD MANAGERS/SUPERVISORS (Himanshu Team) 🕵️‍♂️ ---`);

    // 1. Fetch Users
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, plan_name, role, leads_today, daily_limit, total_leads_received')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', true);

    if (error) { console.error(error); return; }

    // 2. Filter for Managers/Supervisors
    const targets = users.filter(u => {
        const plan = (u.plan_name || '').toLowerCase();
        return plan.includes('manager') || plan.includes('supervisor');
    });

    console.log(`Total Manager/Supervisor Profiles: ${targets.length}`);

    // 3. Check actual leads for today (Double Verification)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // In UTC, 6 AM IST is 00:30 UTC. Let's use 12 AM IST = 18:30 UTC Prev Day
    const START_TIME_ISO = '2026-02-18T18:30:00.000Z';

    const { data: leads } = await supabase
        .from('leads')
        .select('assigned_to')
        .gte('created_at', START_TIME_ISO)
        .neq('status', 'Orphan'); // Only assigned ones

    const leadCounts = {};
    leads.forEach(l => {
        if (l.assigned_to) leadCounts[l.assigned_to] = (leadCounts[l.assigned_to] || 0) + 1;
    });

    // 4. Identify Zeros
    const zeroLeadUsers = [];
    targets.forEach(u => {
        const actualToday = leadCounts[u.id] || 0;
        if (actualToday === 0) {
            zeroLeadUsers.push({
                ...u,
                actualToday
            });
        }
    });

    console.log(`\n--- ❌ ZERO LEADS TODAY (${zeroLeadUsers.length}) ---`);
    if (zeroLeadUsers.length === 0) {
        console.log("Good news! Everyone has received at least 1 lead.");
    } else {
        zeroLeadUsers.forEach(u => {
            console.log(`- ${u.name} (${u.plan_name}) [Limit: ${u.daily_limit}]`);
        });
    }

    console.log(`\n--- ✅ OTHERS (${targets.length - zeroLeadUsers.length}) ---`);
    console.log("Rest have received leads.");

})();
