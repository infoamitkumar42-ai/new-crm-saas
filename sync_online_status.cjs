const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function syncOnlineStatus() {
    console.log("🔄 SYNCING is_online = is_active FOR ALL USERS...\n");

    // Get all users with is_active = true but is_online = false
    const { data: users, error: fetchError } = await supabase
        .from('users')
        .select('id, name, is_active, is_online')
        .eq('is_active', true)
        .eq('is_online', false);

    if (fetchError) return console.error(fetchError);

    if (!users || users.length === 0) {
        console.log("✅ No mismatch found. All users already synced.");
        return;
    }

    console.log(`Found ${users.length} users with is_active=true but is_online=false:`);

    for (const u of users) {
        const { error } = await supabase
            .from('users')
            .update({ is_online: true })
            .eq('id', u.id);

        if (error) {
            console.log(`❌ Failed ${u.name}: ${error.message}`);
        } else {
            console.log(`✅ Synced ${u.name}: is_online = true`);
        }
    }

    console.log("\n🎉 SYNC COMPLETE. All active users are now marked online for webhook.");
}

syncOnlineStatus();
