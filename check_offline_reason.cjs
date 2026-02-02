const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkOfflinePattern() {
    console.log("🕵️ CHECKING WHEN USERS WENT OFFLINE...");

    // Fetch offline users
    const { data: users, error } = await supabase
        .from('users')
        .select('name, updated_at, last_active_at')
        .eq('is_online', false)
        .eq('is_active', true) // Only active plan users
        .order('updated_at', { ascending: false })
        .limit(20);

    if (error) return console.error(error);

    console.log(`\nName                 | Updated At (Offline Time?) | Last Active At`);
    console.log(`---------------------|---------------------------|-------------------`);

    users.forEach(u => {
        const updateTime = new Date(u.updated_at).toLocaleTimeString();
        const activeTime = u.last_active_at ? new Date(u.last_active_at).toLocaleTimeString() : 'Never';
        console.log(`${u.name.padEnd(20)} | ${updateTime.padEnd(25)} | ${activeTime}`);
    });

    // Check if Updated At is clustered
    console.log("\nAnalyzing timestamps...");
    // (Visual check by user primarily)
}

checkOfflinePattern();
