const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    // 1. Define Early Morning (6 AM IST Today)
    const now = new Date();
    // 6 AM IST is roughly UTC today 00:30
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 30, 0, 0);

    console.log(`--- ☀️ MORNING PERFORMANCE AUDIT (OPTIMIZED) ☀️ ---`);
    console.log(`Fetching leads since: ${startOfDay.toISOString()} (Approx 6 AM IST)\n`);

    // 2. Fetch Leads
    const { data: leads, error: lError } = await supabase
        .from('leads')
        .select('id, created_at, name, phone, assigned_to')
        .gte('created_at', startOfDay.toISOString())
        .order('created_at', { ascending: false });

    if (lError) { console.error(lError); return; }

    console.log(`Total Leads Generated Since Morning: ${leads.length}\n`);

    if (leads.length === 0) {
        console.log("No leads found since 6 AM.");
        return;
    }

    // 3. Fetch ALL Users (Batch)
    const { data: users, error: uError } = await supabase
        .from('users')
        .select('id, name, email, plan_name, is_active');

    if (uError) { console.error(uError); return; }

    // Map Users for O(1) Lookup
    const userMap = {};
    users.forEach(u => {
        userMap[u.id] = u;
    });

    // 4. Analyze Distribution
    const distribution = {};
    const planStats = {};
    const missingUsers = new Set();
    const inactiveUsers = new Set();
    const unassignedLeads = [];

    for (const lead of leads) {
        if (!lead.assigned_to) {
            unassignedLeads.push(lead.id);
            continue;
        }

        const user = userMap[lead.assigned_to];

        if (!user) {
            missingUsers.add(lead.assigned_to);
            continue;
        }

        // Group by User
        const userKey = `[${user.plan_name}] ${user.name} (${user.email})`;
        if (!distribution[userKey]) {
            distribution[userKey] = {
                count: 0,
                status: user.is_active ? '✅' : '❌'
            };
        }
        distribution[userKey].count++;

        // Group by Plan
        if (!planStats[user.plan_name]) planStats[user.plan_name] = 0;
        planStats[user.plan_name]++;

        // Check for Inactive
        if (!user.is_active) inactiveUsers.add(user.email);
    }

    // 5. Print Report
    console.log('--- 📊 DISTRIBUTION BY USER ---');
    // Sort distribution by count desc
    const sortedDist = Object.entries(distribution)
        .sort(([, a], [, b]) => b.count - a.count)
        .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});
    console.table(sortedDist);

    console.log('\n--- 📋 DISTRIBUTION BY PLAN ---');
    console.table(planStats);

    console.log('\n--- 🚨 ANOMALY CHECK ---');
    if (unassignedLeads.length > 0) console.log(`⚠️ UNASSIGNED Leads: ${unassignedLeads.length}`);
    if (missingUsers.size > 0) console.log(`⚠️ VALID ID BUT MISSING USER: ${missingUsers.size} (IDs: ${Array.from(missingUsers).join(', ')})`);
    if (inactiveUsers.size > 0) console.log(`❌ LEADS TO INACTIVE USERS: ${Array.from(inactiveUsers).join(', ')}`);

    if (unassignedLeads.length === 0 && missingUsers.size === 0 && inactiveUsers.size === 0) {
        console.log('✅ verification PASSED: All leads assigned to Valid Active Users.');
    } else {
        console.log('❌ verification FAILED: Issues found (see above).');
    }

})();
