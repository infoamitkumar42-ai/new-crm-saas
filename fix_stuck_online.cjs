const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function fixStuckOnlineUsers() {
    console.log("🛠️ FIXING STUCK ONLINE USERS (Last Active Check)...\n");

    // Get current time minus 30 minutes (generous buffer)
    const timeoutThreshold = new Date();
    timeoutThreshold.setMinutes(timeoutThreshold.getMinutes() - 30);

    console.log(`Threshold: ${timeoutThreshold.toISOString()}`);

    // 1. Find users who are ONLINE but Last Active > 30 mins ago
    // Note: We need to fetch all online users and filtering in JS because Supabase timestamp query can be tricky
    const { data: onlineUsers, error } = await supabase
        .from('users')
        .select('id, name, is_online, last_active_at')
        .eq('is_online', true);

    if (error) {
        console.log(`❌ Error: ${error.message}`);
        return;
    }

    const stuckUsers = onlineUsers.filter(u => {
        if (!u.last_active_at) return true; // Online but never active? Fix it.
        const lastActive = new Date(u.last_active_at);
        return lastActive < timeoutThreshold;
    });

    console.log(`Found ${onlineUsers.length} total online users.`);
    console.log(`Found ${stuckUsers.length} users STUCK online (inactive for >30m).\n`);

    if (stuckUsers.length > 0) {
        console.log("Fixing these users:");
        stuckUsers.forEach(u => {
            console.log(`  🔴 ${u.name.padEnd(20)} | Last Active: ${u.last_active_at ? new Date(u.last_active_at).toLocaleString() : 'NEVER'}`);
        });

        // 2. Update them to OFFLINE
        const ids = stuckUsers.map(u => u.id);
        const { error: updateError } = await supabase
            .from('users')
            .update({ is_online: false })
            .in('id', ids);

        if (updateError) {
            console.log(`❌ Update Failed: ${updateError.message}`);
        } else {
            console.log(`\n✅ FIXED! Set ${stuckUsers.length} users to OFFLINE.`);
        }
    } else {
        console.log("✅ All online users seem active (within last 30 mins).");
    }
}

fixStuckOnlineUsers();
