const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function stopExpiredUsers() {
    const targets = ['Himanshu Sharma', 'Raveena', 'Simran'];
    console.log(`🛑 Stopping Users based on Expired Duration: ${targets.join(', ')}...`);

    // Fetch IDs first to be safe
    const { data: users } = await supabase.from('users').select('id, name, is_active').in('name', targets);

    if (!users) return console.log("Users not found.");

    for (const u of users) {
        if (!u.is_active) {
            console.log(`ℹ️ ${u.name} is already stopped.`);
            continue;
        }

        const { error } = await supabase
            .from('users')
            .update({
                is_active: false,
                is_online: false, // Force Offline too
                updated_at: new Date().toISOString()
            })
            .eq('id', u.id);

        if (error) console.error(`❌ Failed to stop ${u.name}:`, error);
        else console.log(`✅ STOPPED: ${u.name} (Plan Expired).`);
    }
}

stopExpiredUsers();
