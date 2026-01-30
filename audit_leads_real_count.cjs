const { createClient } = require('@supabase/supabase-js');

// HARDCODED CREDENTIALS (from previous file)
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function auditCounts() {
    console.log('🔍 AUDITING REAL LEAD COUNTS (DB Rows vs Counter)...');

    // 1. Calculate Start of Day in IST, then convert to UTC
    // Today is Jan 29, 2026. 
    // Jan 29 00:00:00 IST = Jan 28 18:30:00 UTC
    // We can use a generalized approach or hardcode for "today" as per system time

    const now = new Date();
    // Get "Start of Today" in IST
    // We can simply take the current time, convert to IST string, strip time, replace with 00:00:00
    // But easier: 
    // IST is UTC+5.5.

    // Let's rely on the fact the user said "aaj ka".
    // We will query leads created > 2026-01-28T18:30:00.000Z (which is Jan 29 00:00 IST)

    // Dynamic way:
    const istOffset = 5.5 * 60 * 60 * 1000;
    const nowBox = new Date(Date.now() + istOffset); // time as if it was UTC
    nowBox.setUTCHours(0, 0, 0, 0);
    const startOfTodayIST_inUTC = new Date(nowBox.getTime() - istOffset).toISOString();

    console.log(`📅 Start of Day (UTC): ${startOfTodayIST_inUTC} (approx 00:00 IST)`);

    // 2. Fetch Users
    const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, name, email, daily_limit, leads_today, is_active')
        .eq('is_active', true);

    if (uErr) { console.error('Error fetching users:', uErr); return; }

    // 3. Fetch Actual Leads assigned since Start of Day
    const { data: leads, error: lErr } = await supabase
        .from('leads')
        .select('id, assigned_to, created_at')
        .gte('created_at', startOfTodayIST_inUTC);

    if (lErr) { console.error('Error fetching leads:', lErr); return; }

    // 4. Aggregate Real Count
    const actualCounts = {};
    leads.forEach(l => {
        if (l.assigned_to) {
            actualCounts[l.assigned_to] = (actualCounts[l.assigned_to] || 0) + 1;
        }
    });

    // 5. Compare & Report
    let discrepancyCount = 0;
    let totalPendingReal = 0;
    let usersPendingReal = 0;

    console.log('\n%-20s | %-5s | %-8s | %-8s | %-8s', 'Name', 'Limit', 'Stored', 'ACTUAL', 'Pending');
    console.log('--------------------------------------------------------------------------------');

    const discrepancies = [];

    users.forEach(u => {
        if (!u.daily_limit) return;

        const storedCount = u.leads_today || 0;
        const realCount = actualCounts[u.id] || 0;

        let pending = 0;
        if (u.daily_limit > realCount) {
            pending = u.daily_limit - realCount; // Real pending calculation
        }

        if (pending > 0) {
            totalPendingReal += pending;
            usersPendingReal++;
        }

        // Check discrepancy
        if (storedCount !== realCount) {
            discrepancies.push({
                name: u.name,
                stored: storedCount,
                actual: realCount,
                diff: realCount - storedCount
            });
        }

        // Special highlight for Himanshu
        if (u.name && u.name.toLowerCase().includes('himanshu')) {
            console.log(`>> FOCUS: ${u.name} | Limit: ${u.daily_limit} | DbSays: ${storedCount} | Real: ${realCount}`);
        }

        // Print all (or just discrepancies? No, let's print all relevant ones to be sure)
        // If pending > 0 OR discrepancy exists
        if (pending > 0 || storedCount !== realCount) {
            console.log(`%-20s | %-5d | %-8d | %-8d | %-8d %s`,
                u.name.substring(0, 20),
                u.daily_limit,
                storedCount,
                realCount,
                pending,
                storedCount !== realCount ? '⚠️ DIFF' : ''
            );
        }
    });

    console.log('\n=======================================');
    console.log(`🚨 Discrepancies Found: ${discrepancies.length}`);
    if (discrepancies.length > 0) {
        discrepancies.forEach(d => {
            console.log(`   - ${d.name}: Stored ${d.stored} vs Real ${d.actual}`);
        });
    }
    console.log('---------------------------------------');
    console.log(`👥 PROPER Users Pending: ${usersPendingReal}`);
    console.log(`📉 PROPER Total Needed: ${totalPendingReal}`);
    console.log('=======================================');
}

auditCounts();
