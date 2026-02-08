const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function distributeOrphans() {
    console.log("🚀 DISTRIBUTING 5 ORPHAN LEADS...\n");

    // 1. Get orphan leads
    const { data: orphans } = await supabase
        .from('leads')
        .select('id, name')
        .or('status.eq.New,status.eq.Fresh')
        .is('user_id', null)
        .order('created_at', { ascending: true })
        .limit(10);

    if (!orphans || orphans.length === 0) {
        console.log("No orphans to distribute.");
        return;
    }

    // 2. Get eligible users (Online, Active, Has Limit Room)
    const { data: users } = await supabase
        .from('users')
        .select('id, name, leads_today, daily_limit')
        .eq('is_online', true)
        .eq('is_active', true)
        .neq('plan_name', 'none')
        .gt('daily_limit', 0)
        .order('leads_today', { ascending: true })
        .limit(20);

    if (!users || users.length === 0) {
        console.log("No eligible users found!");
        return;
    }

    // Filter users with room
    const eligible = users.filter(u => u.leads_today < u.daily_limit);
    if (eligible.length === 0) {
        console.log("All online users have reached their daily limit!");
        return;
    }

    console.log(`Found ${eligible.length} eligible users. Distributing ${orphans.length} orphans...`);

    let userIdx = 0;
    for (const orphan of orphans) {
        const user = eligible[userIdx % eligible.length];

        const { error } = await supabase
            .from('leads')
            .update({
                user_id: user.id,
                assigned_to: user.id,
                status: 'Assigned',
                assigned_at: new Date().toISOString()
            })
            .eq('id', orphan.id);

        if (error) {
            console.log(`❌ Failed ${orphan.name}: ${error.message}`);
        } else {
            console.log(`✅ ${orphan.name} -> ${user.name}`);
            userIdx++;
        }
    }

    console.log("\n🎉 Orphan distribution complete!");
}

distributeOrphans();
