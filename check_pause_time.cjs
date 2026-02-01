const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkLastUpdate() {
    console.log("🕵️ CHECKING WHEN USERS WENT OFFLINE (Based on 'updated_at')...\n");

    const namesToCheck = ['Sunaina Rani', 'Loveleen kaur', 'Prabhjot kaur', 'Simran']; // Sample checks

    const { data: users, error } = await supabase
        .from('users')
        .select('name, is_online, updated_at, leads_today')
        .in('name', namesToCheck);

    if (error) return console.error(error);

    console.log(`Name                 | Status  | Last Updated At (Approx Pause Time)`);
    console.log(`---------------------|---------|------------------------------------`);

    for (const u of users) {
        let updateTime = "Unknown";
        if (u.updated_at) {
            const date = new Date(u.updated_at);
            updateTime = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        }

        const status = u.is_online ? "🟢 ON" : "🔴 PAUSED";
        console.log(`${u.name.padEnd(20)} | ${status.padEnd(7)} | ${updateTime}`);
    }
}

checkLastUpdate();
