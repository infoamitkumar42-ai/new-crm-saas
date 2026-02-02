const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function fixGhostOnlineUsers() {
    console.log("👻 FIXING GHOST ONLINE USERS...\n");

    // 1. Find users who are ONLINE but INACTIVE (Paused/Unpaid)
    const { data: ghosts, error } = await supabase
        .from('users')
        .select('id, name, email, is_active, payment_status, plan_name')
        .eq('is_online', true)
        .or('is_active.eq.false,payment_status.neq.active,plan_name.eq.none');

    if (error) {
        console.log(`❌ Error finding ghosts: ${error.message}`);
        return;
    }

    if (ghosts.length > 0) {
        console.log(`Found ${ghosts.length} users who should be OFFLINE but are marked ONLINE:`);
        ghosts.forEach(u => console.log(`  🔴 ${u.name} (Active: ${u.is_active}, Payment: ${u.payment_status})`));

        // 2. Force them OFFLINE
        const ids = ghosts.map(u => u.id);
        const { error: updateError } = await supabase
            .from('users')
            .update({ is_online: false })
            .in('id', ids);

        if (updateError) {
            console.log(`❌ Failed to fix: ${updateError.message}`);
        } else {
            console.log(`\n✅ FIXED! Forced ${ghosts.length} users to OFFLINE status.`);
        }
    } else {
        console.log("✅ No ghost online users found. Database is clean.");
    }
}

fixGhostOnlineUsers();
