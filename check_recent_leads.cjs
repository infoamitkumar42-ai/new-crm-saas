const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkRealtimeLeads() {
    console.log("🕵️ CHECKING LEADS RECEIVED IN LAST 30 MINS...\n");

    const now = new Date();
    // 30 mins ago
    const startTime = new Date(now.getTime() - 30 * 60 * 1000).toISOString();

    const { data: leads, error } = await supabase
        .from('leads')
        .select('name, created_at, user:users(name, is_online)')
        .gte('created_at', startTime)
        .order('created_at', { ascending: false });

    if (error) return console.error(error);

    if (leads.length === 0) {
        console.log("⚠️ No leads found in last 30 mins.");
        return;
    }

    console.log(`Time      | Assigned To          | User DB Status | Lead Name`);
    console.log(`----------|----------------------|----------------|----------`);

    for (const l of leads) {
        const time = new Date(l.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        const userName = l.user?.name || 'Unknown';
        const userStatus = l.user?.is_online ? "🟢 ON" : "🔴 OFF";

        console.log(`${time.padEnd(9)} | ${userName.slice(0, 20).padEnd(20)} | ${userStatus.padEnd(14)} | ${l.name}`);
    }
}

checkRealtimeLeads();
