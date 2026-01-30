const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function calcTodayDemand() {
    console.log('📊 CALCULATING DEMAND FOR TODAY (Jan 30)...');

    // Jan 30 00:00 IST = Jan 29 18:30 UTC
    const startOfTodayUTC = '2026-01-29T18:30:00.000Z';
    console.log(`🕒 Start Time (UTC): ${startOfTodayUTC}`);

    // 1. Get ALL Active Users
    // User said "jinka pause nahi hai status bar" -> implies is_active = true
    const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, name, daily_limit')
        .eq('is_active', true)
        .gt('daily_limit', 0);

    if (uErr) { console.error(uErr); return; }

    // 2. Get Real Leads Count for Today
    const { data: leads, error: lErr } = await supabase
        .from('leads')
        .select('assigned_to')
        .gte('created_at', startOfTodayUTC)
        .not('assigned_to', 'is', null);

    if (lErr) { console.error(lErr); return; }

    // Map counts
    const counts = {};
    leads.forEach(l => {
        counts[l.assigned_to] = (counts[l.assigned_to] || 0) + 1;
    });

    let totalLimit = 0;
    let totalReceived = 0;
    let totalPending = 0;

    console.log('\n--- Active Users Breakdown ---');
    console.log('%-20s | %-5s | %-5s | %-5s', 'Name', 'Limit', 'Has', 'Need');
    console.log('------------------------------------------------');

    for (const u of users) {
        const limit = u.daily_limit || 0;
        const has = counts[u.id] || 0;
        const need = Math.max(0, limit - has);

        totalLimit += limit;
        totalReceived += has;
        totalPending += need;

        // Print details only if they need more (to keep it clean) or if user wants full analysis
        // Printing all active users ensures transparency
        console.log(`%-20s | %-5d | %-5d | %-5d`, u.name.substring(0, 20), limit, has, need);
    }

    console.log('------------------------------------------------');
    console.log(`👥 Total Active Users: ${users.length}`);
    console.log(`🎯 Total Daily Target: ${totalLimit}`);
    console.log(`✅ Already Received:   ${totalReceived}`);
    console.log(`📉 STILL NEEDED:       ${totalPending}`);
    console.log('=======================================');
}

calcTodayDemand();
