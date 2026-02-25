const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log('=== EVENING DISTRIBUTION REPORT ===');
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0); // UTC start (IST 5:30 AM is handled by logic usually, but let's stick to standard day for now)

    // 1. Check Last Lead Time (System Vitality)
    const { data: lastLead } = await supabase
        .from('leads')
        .select('created_at, assigned_to, name')
        .order('created_at', { ascending: false })
        .limit(1);

    if (lastLead && lastLead.length > 0) {
        const lastTime = new Date(lastLead[0].created_at);
        const timeDiff = Math.floor((now - lastTime) / 60000); // minutes
        console.log(`✅ System Status: ACTIVE`);
        console.log(`   Last Lead: ${timeDiff} mins ago (${lastTime.toLocaleTimeString()})`);
    } else {
        console.log(`❌ System Status: INACTIVE (No leads found)`);
    }

    // 2. Team Stats
    const teams = ['TEAMFIRE', 'GJ01TEAMFIRE', 'TEAMRAJ'];
    const teamNames = { 'TEAMFIRE': 'Himanshu', 'GJ01TEAMFIRE': 'Chirag', 'TEAMRAJ': 'Rajwinder' };

    console.log(`\n| Team | Active Users | Daily Limit | Leads Today | Pending (Shortfall) |`);
    console.log(`|---|---|---|---|---|`);

    let totalPending = 0;

    for (const team of teams) {
        // Fetch users
        const { data: users } = await supabase
            .from('users')
            .select('daily_limit, leads_today, id')
            .eq('team_code', team)
            .eq('is_active', true);

        if (!users) continue;

        const activeCount = users.length;
        const totalLimit = users.reduce((sum, u) => sum + (u.daily_limit || 0), 0);
        const leadsDelivered = users.reduce((sum, u) => sum + (u.leads_today || 0), 0);

        let pending = totalLimit - leadsDelivered;
        if (pending < 0) pending = 0; // Over-delivery shouldn't count as negative pending

        totalPending += pending;

        console.log(`| ${teamNames[team]} (${team}) | ${activeCount} | ${totalLimit} | ${leadsDelivered} | ${pending} |`);
    }

    console.log(`\n💰 Total Pending Requirements: ${totalPending} Leads`);

    // 3. Round Robin Balance Check (Sample)
    // Check standard deviation or min/max of leads_today for users with same limit
    console.log('\n--- Balance Check (Sample: TEAMFIRE, Limit 7) ---');
    const { data: sampleUsers } = await supabase
        .from('users')
        .select('name, leads_today')
        .eq('team_code', 'TEAMFIRE')
        .eq('daily_limit', 7)
        .eq('is_active', true)
        .limit(10);

    if (sampleUsers) {
        sampleUsers.forEach(u => console.log(`   ${u.name}: ${u.leads_today}`));
    }
})();
