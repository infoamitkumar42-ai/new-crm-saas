const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    // 1. Define Early Morning (6 AM IST Today)
    const now = new Date();
    // Convert current time to IST string just for logging
    const istString = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    // Create Date object for 6 AM IST Today
    // (Roughly 00:30 UTC)
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 30, 0, 0);

    console.log(`--- ☀️ MORNING PERFORMANCE AUDIT ☀️ ---`);
    console.log(`Time Now (IST): ${istString}`);
    console.log(`Fetching leads since: ${startOfDay.toISOString()} (Approx 6 AM IST)\n`);

    // 2. Fetch Leads
    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, created_at, name, phone, assigned_to')
        .gte('created_at', startOfDay.toISOString())
        .order('created_at', { ascending: false });

    if (error) { console.error(error); return; }

    console.log(`Total Leads Generated Since Morning: ${leads.length}\n`);

    if (leads.length === 0) {
        console.log("No leads found since 6 AM.");
        return;
    }

    // 3. Analyze Distribution
    const distribution = {};
    const planStats = {};
    const unknownUsers = [];
    const inactiveUsers = [];

    for (const lead of leads) {
        if (!lead.assigned_to) {
            console.log(`⚠️ Unassigned Lead: ${lead.id}`);
            continue;
        }

        const { data: user } = await supabase
            .from('users')
            .select('name, email, plan, is_active')
            .eq('id', lead.assigned_to)
            .single();

        if (!user) {
            unknownUsers.push(lead.assigned_to);
            continue;
        }

        // Group by User
        const userKey = `${user.name} (${user.email})`;
        if (!distribution[userKey]) {
            distribution[userKey] = {
                count: 0,
                plan: user.plan,
                status: user.is_active ? '✅' : '❌'
            };
        }
        distribution[userKey].count++;

        // Group by Plan
        if (!planStats[user.plan]) planStats[user.plan] = 0;
        planStats[user.plan]++;

        // Check for Inactive
        if (!user.is_active) inactiveUsers.push(user.email);
    }

    // 4. Print Report
    console.log('--- 📊 DISTRIBUTION BY USER ---');
    console.table(distribution);

    console.log('\n--- 📋 DISTRIBUTION BY PLAN ---');
    console.table(planStats);

    console.log('\n--- 🚨 ANOMALY CHECK ---');
    if (unknownUsers.length > 0) console.log(`⚠️ Leads assigned to Unknown IDs: ${unknownUsers.length}`);
    if (inactiveUsers.length > 0) console.log(`❌ Leads assigned to INACTIVE USERS: ${inactiveUsers.join(', ')}`);
    if (unknownUsers.length === 0 && inactiveUsers.length === 0) console.log('✅ verification PASSED: All leads assigned to Valid Active Users.');
})();
