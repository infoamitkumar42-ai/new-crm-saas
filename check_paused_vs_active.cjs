const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkPausedVsActive() {
    console.log("🔍 CHECKING PAUSED vs ACTIVE USERS...\n");

    // Get users with payment_status = active (paid users)
    const { data: users } = await supabase
        .from('users')
        .select('name, is_active, is_online, plan_name, payment_status')
        .neq('plan_name', 'none')
        .eq('payment_status', 'active')
        .order('is_active', { ascending: true });

    if (!users) return;

    const paused = users.filter(u => u.is_active === false);
    const active = users.filter(u => u.is_active === true);

    console.log(`📊 PAUSED (is_active = false): ${paused.length} users`);
    paused.forEach(u => {
        console.log(`  ❌ ${u.name} - is_online: ${u.is_online}`);
    });

    console.log(`\n📊 ACTIVE (is_active = true): ${active.length} users`);

    // Count how many are online vs offline
    const activeOnline = active.filter(u => u.is_online === true).length;
    const activeOffline = active.filter(u => u.is_online === false).length;

    console.log(`  🟢 Online: ${activeOnline}`);
    console.log(`  🔴 Offline: ${activeOffline}`);

    console.log(`\n================================`);
    console.log(`Total Paid Users: ${users.length}`);
    console.log(`Expect Online (is_active = true): ${active.length}`);
    console.log(`Expect Offline (is_active = false): ${paused.length}`);
}

checkPausedVsActive();
