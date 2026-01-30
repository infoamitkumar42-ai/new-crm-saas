const { createClient } = require('@supabase/supabase-js');

// HARDCODED CREDENTIALS
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function reportDailyStats() {
    console.log('📊 GENERATING DAILY REPORT (Jan 29, 2026)...');

    // 1. Time Setup: Start of Day (Jan 29 00:00 IST)
    // Jan 29 00:00 IST = Jan 28 18:30 UTC
    const istOffset = 5.5 * 60 * 60 * 1000;
    const nowBox = new Date(Date.now() + istOffset);
    nowBox.setUTCHours(0, 0, 0, 0);
    const startOfTodayIST_inUTC = new Date(nowBox.getTime() - istOffset).toISOString();

    console.log(`🕒 Time Range: Since ${startOfTodayIST_inUTC} (approx 00:00 IST)`);

    // 2. Total Leads Generated (Meta/All)
    // We count all leads created today
    const { count: totalLeadsGen, error: lErr } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfTodayIST_inUTC);

    if (lErr) { console.error('Error fetching leads:', lErr); return; }

    // 3. Active Users & Total Demand
    const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, daily_limit, leads_today')
        .eq('is_active', true)
        .gt('daily_limit', 0);

    if (uErr) { console.error('Error fetching users:', uErr); return; }

    let totalDemand = 0;
    let activeUsersCount = users.length;
    let totalDistributed = 0;

    users.forEach(u => {
        totalDemand += (u.daily_limit || 0);
        totalDistributed += (u.leads_today || 0);
    });

    console.log('\n=======================================');
    console.log(`📥 Total Leads Generated (Today):  ${totalLeadsGen}`);
    console.log(`👥 Active Users (with limit > 0):  ${activeUsersCount}`);
    console.log(`🎯 Total Daily Requirement:        ${totalDemand}`);
    console.log(`✅ Total Distributed (to users):   ${totalDistributed}`);
    console.log('=======================================');

    // Quick Math Check
    const pending = totalDemand - totalDistributed;
    console.log(`📉 Pending to deliver:             ${pending}`);
    console.log(`🗑️ Unassigned/Rejected/System:     ${totalLeadsGen - totalDistributed}`);
    console.log('=======================================');
}

reportDailyStats();
