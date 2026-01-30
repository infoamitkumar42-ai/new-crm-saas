const { createClient } = require('@supabase/supabase-js');

// HARDCODED CREDENTIALS
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function reportYesterday() {
    console.log('📊 ANALYZING YESTERDAY (Jan 29, 2026)...');

    // 1. Time Range for Jan 29 IST
    // Start: Jan 29 00:00 IST -> Jan 28 18:30 UTC
    // End:   Jan 30 00:00 IST -> Jan 29 18:30 UTC
    const startUTC = '2026-01-28T18:30:00.000Z';
    const endUTC = '2026-01-29T18:30:00.000Z';

    console.log(`🕒 Range (UTC): ${startUTC} to ${endUTC}`);

    // 2. Fetch all leads assigned yesterday
    const { data: leads, error: lErr } = await supabase
        .from('leads')
        .select('assigned_to')
        .gte('created_at', startUTC)
        .lt('created_at', endUTC)
        .not('assigned_to', 'is', null);

    if (lErr) { console.error('Error leads:', lErr); return; }

    const leadCounts = {};
    leads.forEach(l => {
        leadCounts[l.assigned_to] = (leadCounts[l.assigned_to] || 0) + 1;
    });

    // 3. Fetch Users
    const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, name, daily_limit')
        .eq('is_active', true)
        .gt('daily_limit', 0);

    if (uErr) { console.error('Error users:', uErr); return; }

    let completedCount = 0;
    let pendingCount = 0;
    let pendingDetails = [];
    let completedDetails = [];

    console.log('\n--- Status for Jan 29 ---');
    console.log('%-20s | %-5s | %-5s | %s', 'Name', 'Limit', 'Recvd', 'Status');
    console.log('----------------------------------------------------');

    for (const u of users) {
        const received = leadCounts[u.id] || 0;
        const limit = u.daily_limit;

        if (received >= limit) {
            completedCount++;
            completedDetails.push(u.name);
            // console.log(`%-20s | %-5d | %-5d | ✅ DONE`, u.name, limit, received);
        } else {
            pendingCount++;
            pendingDetails.push({ name: u.name, diff: limit - received });
            console.log(`%-20s | %-5d | %-5d | ❌ PENDING (${limit - received} more)`, u.name.substring(0, 20), limit, received);
        }
    }

    console.log('\n=======================================');
    console.log(`✅ USERS COMPLETED (Full Quota): ${completedCount}`);
    console.log(`❌ USERS PENDING   (Short):      ${pendingCount}`);
    console.log('=======================================');

    // Optional: List completed if numbers are small? Or user just asked for count?
    // User asked: "kitne logo ka daily limit pura ho gya tha aur kitne logo ka pending tha"
    // He might want lists if counts are small.
}

reportYesterday();
