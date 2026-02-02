const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function showAllOnlineUsers() {
    console.log("🔍 SHOWING ALL ONLINE USERS (is_online = true)...\n");

    const { data: users, count } = await supabase
        .from('users')
        .select('name, plan_name, payment_status, is_active', { count: 'exact' })
        .eq('is_online', true);

    if (!users) return;

    console.log(`Total Online: ${count}\n`);

    // Group by payment_status
    const paid = users.filter(u => u.payment_status === 'active');
    const unpaid = users.filter(u => u.payment_status !== 'active');

    console.log(`✅ PAID (payment_status = active): ${paid.length}`);
    console.log(`❌ UNPAID/INACTIVE: ${unpaid.length}`);

    if (unpaid.length > 0) {
        console.log(`\nUnpaid users who are online (should be offline):`);
        unpaid.forEach(u => console.log(`  - ${u.name} (plan: ${u.plan_name}, status: ${u.payment_status})`));
    }
}

showAllOnlineUsers();
