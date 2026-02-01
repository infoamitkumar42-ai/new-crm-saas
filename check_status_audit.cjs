const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkPauseResumeStatus() {
    console.log("🕵️ CHECKING USER ONLINE/OFFLINE STATUS & TIMINGS...\n");

    // Fetch Only Active Plan Users (Ignore Expired)
    const { data: users, error } = await supabase
        .from('users')
        .select('name, is_online, last_active_at, last_login, leads_today')
        .eq('is_active', true)
        .neq('plan_name', 'none')
        .order('is_online', { ascending: false }) // Online First
        .order('last_active_at', { ascending: false }); // Recently Active First

    if (error) return console.error(error);

    let onlineCount = 0;
    let offlineCount = 0;

    console.log(`Name                 | Status  | Last Active Time   | Leads Today`);
    console.log(`---------------------|---------|--------------------|------------`);

    for (const u of users) {
        // Format Time
        let timeStr = "No Activity";
        if (u.last_active_at) {
            const date = new Date(u.last_active_at);
            timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

            // Allow checking if it was today
            const isToday = new Date().toDateString() === date.toDateString();
            if (!isToday) timeStr += " (Old)";
        }

        const status = u.is_online ? "🟢 ON" : "🔴 PAUSED";
        if (u.is_online) onlineCount++; else offlineCount++;

        console.log(`${u.name.slice(0, 19).padEnd(20)} | ${status.padEnd(7)} | ${timeStr.padEnd(18)} | ${u.leads_today}`);
    }

    console.log(`\n================================`);
    console.log(`✅ TOTAL RESUMED (ONLINE): ${onlineCount}`);
    console.log(`⏸️ TOTAL PAUSED  (OFFLINE): ${offlineCount}`);
    console.log(`================================`);
}

checkPauseResumeStatus();
