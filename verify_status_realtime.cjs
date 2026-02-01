const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkStatusNow() {
    console.log("🕵️ CHECKING LEADS IN LAST 5 MINUTES (LIVE VERIFICATION)...\n");

    const now = new Date();
    // 5 mins ago
    const startTime = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

    const { data: leads, error } = await supabase
        .from('leads')
        .select('name, created_at, status, user_id, source')
        .gte('created_at', startTime)
        .order('created_at', { ascending: false });

    if (error) return console.error(error);

    if (leads.length === 0) {
        console.log("⚠️ No leads received in the last 5 minutes. (Cannot verify fix yet)");
        return;
    }

    console.log(`Time      | Status   | Assigned To          | User Online?`);
    console.log(`----------|----------|----------------------|-------------`);

    let offlineAssigned = 0;

    for (const l of leads) {
        const time = new Date(l.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

        let agentName = "Unassigned";
        let isOnline = "N/A";

        if (l.user_id) {
            const { data: u } = await supabase.from('users').select('name, is_online').eq('id', l.user_id).single();
            if (u) {
                agentName = u.name;
                isOnline = u.is_online ? "🟢 ON" : "🔴 OFF";
                if (!u.is_online) offlineAssigned++;
            }
        }

        console.log(`${time.padEnd(9)} | ${l.status.padEnd(8)} | ${agentName.slice(0, 20).padEnd(20)} | ${isOnline}`);
    }
    console.log("\n---------------------------------------------------");
    if (offlineAssigned > 0) {
        console.log(`❌ FAILED: ${offlineAssigned} leads went to OFFLINE users. Code NOT live.`);
    } else {
        console.log("✅ PASSED: No leads assigned to Offline users.");
    }
}

checkStatusNow();
