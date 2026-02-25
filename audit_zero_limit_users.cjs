const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log('=== AUDIT: ZERO LIMIT & STALLED USERS ===');

    // Fetch all active paid users
    const { data: users, error } = await supabase
        .from('users')
        .select('name, email, plan_name, daily_limit, leads_today, team_code, is_online, valid_until, total_leads_received, total_leads_promised')
        .eq('is_active', true)
        .neq('plan_name', 'none');

    if (error) {
        console.error(error);
        return;
    }

    const zeroLimitUsers = [];
    const stalledUsers = []; // Limit > 0 but Leads = 0

    const now = new Date();

    for (const u of users) {
        // Check 1: Zero Limit
        if ((u.daily_limit || 0) === 0) {
            zeroLimitUsers.push({
                name: u.name,
                email: u.email,
                team: u.team_code || 'NO TEAM',
                plan: u.plan_name
            });
            continue;
        }

        // Check 2: Stalled (Leads = 0)
        if ((u.leads_today || 0) === 0) {
            let reason = 'Unknown';
            const expiry = new Date(u.valid_until);
            const pendingQuota = (u.total_leads_promised || 0) - (u.total_leads_received || 0);

            if (!u.team_code) reason = '❌ NO TEAM ASSIGNED';
            else if (!u.is_online) reason = '⚠️ OFFLINE';
            else if (expiry < now) reason = '❌ EXPIRED';
            else if (pendingQuota <= 0) reason = '❌ QUOTA FULL';
            else reason = '⏳ WAITING (Queue)';

            stalledUsers.push({
                name: u.name,
                team: u.team_code,
                reason: reason,
                online: u.is_online
            });
        }
    }

    console.log(`\n🔴 ACTIVE USERS WITH 0 DAILY LIMIT: ${zeroLimitUsers.length}`);
    if (zeroLimitUsers.length > 0) {
        console.table(zeroLimitUsers);
    } else {
        console.log('✅ None! All active users have a limit > 0.');
    }

    console.log(`\n🟠 ACTIVE USERS WITH 0 LEADS TODAY: ${stalledUsers.length}`);

    // Group Stalled by Team
    const stalledByTeam = {};
    stalledUsers.forEach(u => {
        const team = u.team || 'Unknown';
        if (!stalledByTeam[team]) stalledByTeam[team] = [];
        stalledByTeam[team].push(u);
    });

    for (const team in stalledByTeam) {
        console.log(`\n[${team}] Stalled Users:`);
        stalledByTeam[team].forEach(u => {
            console.log(`  - ${u.name.padEnd(20)} | Reason: ${u.reason}`);
        });
    }

})();
