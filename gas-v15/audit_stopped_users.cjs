
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function auditStopped() {
    console.log("🛑 Auditing Stopped (Full) Users...\n");

    // 1. Get ALL Active Users
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, leads_today, daily_limit')
        .eq('is_active', true);

    if (error) { console.error("Err:", error); return; }

    // 2. Filter Stopped Users (Leads >= Limit)
    // Exclude those with 0 limit (Paused) if we only want "Full"
    const stoppedUsers = users.filter(u => u.daily_limit > 0 && u.leads_today >= u.daily_limit);

    console.log(`📋 Total Stopped/Full Users: ${stoppedUsers.length}`);
    console.log("---------------------------------------------------");
    console.log("Top 10 Stopped Users (Most Over-Limit):");

    // Sort by overflow
    stoppedUsers.sort((a, b) => (b.leads_today - b.daily_limit) - (a.leads_today - a.daily_limit));

    stoppedUsers.slice(0, 10).forEach(u => {
        const overflow = u.leads_today - u.daily_limit;
        console.log(`   ⛔ ${u.name.padEnd(20)} | Limit: ${u.daily_limit} | Has: ${u.leads_today} (+${overflow})`);
    });

    if (stoppedUsers.length > 10) console.log(`   ... and ${stoppedUsers.length - 10} more.`);

    // 3. Verify NO LEADS in last 15 mins for these users
    const checkTime = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const stoppedIds = stoppedUsers.map(u => u.id);

    if (stoppedIds.length > 0) {
        const { data: recentLeads, error: lErr } = await supabase
            .from('leads')
            .select('id, name, assigned_to')
            .in('assigned_to', stoppedIds)
            .gte('assigned_at', checkTime);

        if (lErr) { console.error("Lead Err:", lErr); return; }

        if (recentLeads.length === 0) {
            console.log("\n✅ SECURITY CHECK PASSED: Zero leads assigned to these users in last 15 mins.");
        } else {
            console.log(`\n❌ SECURITY ALERT: ${recentLeads.length} leads slipped through!`);
            // This would be bad
        }
    }
}

auditStopped();
