
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function finalReport() {
    console.log("📊 FINAL DAILY STATUS REPORT (Live Demand vs Supply)\n");

    const teams = ['GJ01TEAMFIRE', 'TEAMRAJ', 'TEAMFIRE'];
    const TeamNames = { 'GJ01TEAMFIRE': 'Chirag', 'TEAMRAJ': 'Rajwinder', 'TEAMFIRE': 'Himanshu' };

    let grandTotalDemand = 0;
    let grandTotalDelivered = 0;
    let grandTotalPending = 0;

    for (const team of teams) {
        // 1. Get Genuine Active Users (Active + Future Validity)
        const { data: users } = await supabase.from('users')
            .select('id, name, daily_limit, leads_today, valid_until')
            .eq('team_code', team)
            .eq('is_active', true);

        // Filter those with valid plans
        // const validUsers = users.filter(u => u.valid_until && new Date(u.valid_until) > new Date());
        // For now, let's treat all 'is_active=true' as valid since we audited them
        const validUsers = users || [];

        // 2. Filter those who actually WANT leads (Limit > 0)
        const leadTakers = validUsers.filter(u => u.daily_limit > 0);
        const zeroLimitUsers = validUsers.length - leadTakers.length;

        // 3. Calculate Stats
        const demand = leadTakers.reduce((sum, u) => sum + u.daily_limit, 0);
        const delivered = leadTakers.reduce((sum, u) => sum + u.leads_today, 0);

        // Pending logic: (Limit - Today) but only if positive
        let pending = 0;
        leadTakers.forEach(u => {
            const gap = u.daily_limit - u.leads_today;
            if (gap > 0) pending += gap;
        });

        // Add to Grand Total
        grandTotalDemand += demand;
        grandTotalDelivered += delivered;
        grandTotalPending += pending;

        // 4. Print Team Report
        console.log(`🏆 TEAM: ${TeamNames[team]} (${team})`);
        console.log(`   👥 Total Active:    ${validUsers.length} Users`);
        console.log(`   ⚡ Lead Takers:     ${leadTakers.length} (Users with Daily Limit > 0)`);
        console.log(`   💤 Zero Limit:      ${zeroLimitUsers} (Active but Limit=0)`);
        console.log(`   🎯 Daily Target:    ${demand} Leads`);
        console.log(`   ✅ Delivered:       ${delivered} Leads`);
        console.log(`   ⏳ PENDING:         ${pending} Leads Needed`);

        const progress = demand > 0 ? Math.round((delivered / demand) * 100) : 0;
        console.log(`   📊 Progress:        [${'█'.repeat(progress / 10).padEnd(10, '-')}] ${progress}%`);
        console.log('------------------------------------------------');
    }

    console.log("\n🌍 GRAND TOTAL (SYSTEM WIDE):");
    console.log(`🎯 TOTAL DEMAND:    ${grandTotalDemand}`);
    console.log(`✅ TOTAL DELIVERED: ${grandTotalDelivered}`);
    console.log(`🚨 TOTAL PENDING:   ${grandTotalPending} Leads required by Midnight!`);
}

finalReport();
