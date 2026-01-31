const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function calculateRemainingDemand() {
    console.log("📊 CALCULATING REMAINING LEAD DEMAND (Today)...\n");

    // Fetch Active Paid Users
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, plan_name, daily_limit, leads_today, is_online, is_active')
        .eq('is_active', true)
        .neq('plan_name', 'none');

    if (error) return console.error(error);

    let totalNeeded = 0;
    let onlineNeeded = 0;
    let offlineNeeded = 0;

    const breakdown = {};

    console.log(`Name                 | Plan        | Status  | Today  | Limit | NEEDED`);
    console.log(`---------------------|-------------|---------|--------|-------|-------`);

    for (const u of users) {
        let needed = (u.daily_limit || 0) - (u.leads_today || 0);
        if (needed < 0) needed = 0;

        if (needed === 0) continue; // Skip fulfilled users

        totalNeeded += needed;

        if (u.is_online) {
            onlineNeeded += needed;
        } else {
            offlineNeeded += needed;
        }

        // Add to Plan Breakdown
        const plan = u.plan_name || 'Unknown';
        if (!breakdown[plan]) breakdown[plan] = 0;
        breakdown[plan] += needed;

        const statusIcon = u.is_online ? "🟢 On" : "🔴 Off";

        console.log(
            `${u.name.slice(0, 19).padEnd(20)} | ` +
            `${plan.padEnd(11)} | ` +
            `${statusIcon.padEnd(7)} | ` +
            `${String(u.leads_today).padEnd(6)} | ` +
            `${String(u.daily_limit).padEnd(5)} | ` +
            `**${needed}**`
        );
    }

    console.log(`\n=================================================`);
    console.log(`📢 TOTAL LEADS NEEDED NOW:   ${totalNeeded}`);
    console.log(`=================================================`);
    console.log(`🟢 For Online Users:         ${onlineNeeded}`);
    console.log(`🔴 For Offline Users:        ${offlineNeeded}`);
    console.log(`-------------------------------------------------`);
    console.log(`📌 Plan Breakdown:`);
    for (const [p, count] of Object.entries(breakdown)) {
        console.log(`   - ${p.padEnd(12)}: ${count}`);
    }
}

calculateRemainingDemand();
