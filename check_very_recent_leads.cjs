const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkLiveStatus() {
    console.log("🕵️ CHECKING LEADS IN LAST 10 MINUTES (Post-Fix Verification)...\n");

    const now = new Date();
    const startTime = new Date(now.getTime() - 10 * 60 * 1000).toISOString();

    const { data: leads, error } = await supabase
        .from('leads')
        .select('name, created_at, status, user_id, source')
        .gte('created_at', startTime)
        .order('created_at', { ascending: false });

    if (error) return console.error(error);

    if (leads.length === 0) {
        console.log("⚠️ No leads received in the last 10 minutes.");
        return;
    }

    console.log(`Time      | Status   | Assigned To (If Any)`);
    console.log(`----------|----------|---------------------`);

    for (const l of leads) {
        const time = new Date(l.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

        let agentName = "Unassigned";
        if (l.user_id) {
            const { data: u } = await supabase.from('users').select('name, is_online').eq('id', l.user_id).single();
            agentName = u ? `${u.name} (${u.is_online ? '🟢' : '🔴'})` : 'Unknown ID';
        }

        console.log(`${time.padEnd(9)} | ${l.status.padEnd(8)} | ${agentName}`);
    }
}

checkLiveStatus();
