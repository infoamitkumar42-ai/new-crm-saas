const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkRaveena() {
    console.log("🕵️ INSPECTING RAVEENA STATUS DETAILS...\n");

    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .ilike('name', '%gurnam%')
        .single();

    if (error) return console.error(error);
    if (!user) return console.error("Raveena Not Found");

    console.log(`Name: ${user.name}`);
    console.log(`ID: ${user.id}`);
    console.log(`Status: ${user.is_online ? '🟢 ONLINE' : '🔴 OFFLINE'}`);
    console.log(`Plan Active: ${user.is_active}`);
    console.log(`Plan Name: ${user.plan_name}`);
    console.log(`Leads Today: ${user.leads_today}`);
    console.log(`Daily Limit: ${user.daily_limit}`);
    console.log(`Valid Until: ${user.valid_until}`);
    console.log(`Manager ID: ${user.manager_id}`);

    const hasLimit = (user.leads_today < user.daily_limit);
    console.log(`\nEligibility Check:`);
    console.log(`- Limit Remaining? ${hasLimit ? '✅ YES' : '❌ NO'}`);

    // Check if limit is the reason
    if (!hasLimit) console.log("⚠️ REASON: Daily Limit Reached!");
}

checkRaveena();
