const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function reportChiragTeam() {
    const today = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
    const teamCode = 'GJ01TEAMFIRE';

    console.log(`--- 📊 CHIRAG TEAM REPORT (Today: ${today.split('T')[0]}) ---`);

    // 1. Fetch all users in Chirag's team
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, name, email, daily_limit, is_active, is_plan_pending, total_leads_promised, total_leads_received')
        .eq('team_code', teamCode)
        .neq('role', 'manager');

    if (userError) {
        console.error('Error fetching users:', userError);
        return;
    }

    console.log(`Total Team Members Scouts: ${users.length}\n`);

    let fullCount = 0;
    let partialCount = 0;
    let zeroCount = 0;
    let inactiveCount = 0;

    const results = [];

    for (const user of users) {
        // 2. Count leads assigned to this user today
        const { count, error: leadError } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', user.id)
            .gte('created_at', today);

        const leadsToday = count || 0;
        const limit = user.daily_limit || 0;
        const isFull = leadsToday >= limit && limit > 0;
        const isInactive = !user.is_active || user.is_plan_pending;

        if (isInactive) inactiveCount++;
        else if (isFull) fullCount++;
        else if (leadsToday === 0) zeroCount++;
        else partialCount++;

        results.push({
            name: user.name,
            email: user.email,
            limit: limit,
            received: leadsToday,
            isFull: isFull,
            isInactive: isInactive,
            reason: isInactive ? (user.is_plan_pending ? 'Plan Pending' : 'Inactive') : (isFull ? 'Limit Reached' : 'Waiting for Leads'),
            quotaLeft: (user.total_leads_promised || 0) - (user.total_leads_received || 0)
        });
    }

    // Sort: Active first, then by leads received
    results.sort((a, b) => b.received - a.received);

    console.log('--- INDIVIDUAL STATUS ---');
    results.forEach(u => {
        const marker = u.isInactive ? '❌' : (u.isFull ? '✅' : '⏳');
        console.log(`${marker} ${u.name} (${u.email})`);
        console.log(`   - Limit: ${u.limit} | Received: ${u.received} | Status: ${u.reason} | Plan Quota Left: ${u.quotaLeft}`);
    });

    console.log('\n--- 📈 SUMMARY ---');
    console.log(`✅ Daily Limit Full: ${fullCount}`);
    console.log(`⏳ Partially Filled: ${partialCount}`);
    console.log(`📉 Zero Leads Today: ${zeroCount}`);
    console.log(`❌ Inactive/Pending: ${inactiveCount}`);
}

reportChiragTeam();
