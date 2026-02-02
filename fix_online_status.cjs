const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function fixOnlineStatus() {
    console.log("🔧 FIXING ONLINE STATUS...\n");

    // 1. Set all UNPAID users to OFFLINE
    const { data: unpaidFixed, error: e1 } = await supabase
        .from('users')
        .update({ is_online: false })
        .neq('payment_status', 'active')
        .select('id');

    console.log(`❌ Set ${unpaidFixed?.length || 0} UNPAID users to OFFLINE`);

    // 2. Set users with plan_name = 'none' to OFFLINE
    const { data: noneFixed, error: e2 } = await supabase
        .from('users')
        .update({ is_online: false })
        .eq('plan_name', 'none')
        .select('id');

    console.log(`❌ Set ${noneFixed?.length || 0} users with plan=none to OFFLINE`);

    // 3. Set users with is_active = false to OFFLINE (PAUSED)
    const { data: pausedFixed, error: e3 } = await supabase
        .from('users')
        .update({ is_online: false })
        .eq('is_active', false)
        .select('id');

    console.log(`❌ Set ${pausedFixed?.length || 0} PAUSED users to OFFLINE`);

    // 4. Now count final online
    const { count: onlineCount } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('is_online', true);

    console.log(`\n✅ FINAL ONLINE COUNT: ${onlineCount}`);
    console.log("Only PAID, ACTIVE (not paused), and with valid plan are now ONLINE.");
}

fixOnlineStatus();
