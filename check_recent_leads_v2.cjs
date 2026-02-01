const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkRealtimeLeadsRetry() {
    console.log("🕵️ CHECKING LEADS RECEIVED IN LAST 2 HOURS...\n");

    const now = new Date();
    const startTime = new Date(now.getTime() - 120 * 60 * 1000).toISOString(); // 2 Hours

    const { data: leads, error } = await supabase
        .from('leads')
        .select('name, created_at, user_id')
        .gte('created_at', startTime)
        .order('created_at', { ascending: false });

    if (error) return console.error(error);

    if (!leads || leads.length === 0) {
        console.log("⚠️ No leads found in last 2 hours.");
        return;
    }

    // Fetch User Names manually
    const userIds = [...new Set(leads.map(l => l.user_id).filter(id => id))];
    const { data: users } = await supabase.from('users').select('id, name, is_online').in('id', userIds);

    const userMap = {};
    users.forEach(u => userMap[u.id] = u);

    console.log(`Time      | Assigned To          | User DB Status | Lead Name`);
    console.log(`----------|----------------------|----------------|----------`);

    for (const l of leads) {
        const time = new Date(l.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        const user = userMap[l.user_id];
        const userName = user ? user.name : 'Unknown';
        const userStatus = user ? (user.is_online ? "🟢 ON" : "🔴 OFF") : "Unknown";

        console.log(`${time.padEnd(9)} | ${userName.slice(0, 20).padEnd(20)} | ${userStatus.padEnd(14)} | ${l.name}`);
    }
}

checkRealtimeLeadsRetry();
