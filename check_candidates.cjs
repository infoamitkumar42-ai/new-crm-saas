const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkWhoNeedsLeads() {
    console.log("📊 CHECKING CANDIDATES FOR MANUAL ASSIGNMENT (Online Only)...\n");

    // Fetch Active & Online Users
    const { data: users, error } = await supabase
        .from('users')
        .select('name, plan_name, leads_today, daily_limit, is_online')
        .eq('is_active', true)
        .eq('is_online', true)  // Only Online
        .neq('plan_name', 'none')
        .order('leads_today', { ascending: true }) // Lowest Leads First
        .order('plan_weight', { ascending: false }); // Then High Plan

    if (error) return console.error(error);

    if (users.length === 0) {
        console.log("⚠️ No Users are ONLINE right now!");
        return;
    }

    console.log(`Name                 | Plan        | Today | Limit | Queue Order`);
    console.log(`---------------------|-------------|-------|-------|------------`);

    let rank = 1;
    for (const u of users) {
        const remaining = u.daily_limit - u.leads_today;
        if (remaining <= 0) continue; // Skip full active users

        console.log(
            `${u.name.slice(0, 19).padEnd(20)} | ` +
            `${u.plan_name.padEnd(11)} | ` +
            `${String(u.leads_today).padEnd(5)} | ` +
            `${String(u.daily_limit).padEnd(5)} | ` +
            `#${rank++}`
        );
    }
}

checkWhoNeedsLeads();
