const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkRecentTraffic() {
    console.log("🕵️ CHECKING TRAFFIC SINCE 4:30 PM (Last 25 Mins)...\n");

    // Fetch leads created after 4:30 PM today
    const startTime = new Date();
    startTime.setHours(16, 30, 0, 0); // 4:30 PM

    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, name, created_at, status, assigned_to, source')
        .gt('created_at', startTime.toISOString())
        .order('created_at', { ascending: false });

    if (error) return console.error(error);

    if (leads.length === 0) {
        console.log("❌ NO NEW LEADS found since 4:30 PM.");
        console.log("It seems Meta is not sending leads or traffic stopped.");
    } else {
        console.log(`✅ Found ${leads.length} NEW Leads since 4:30 PM:`);
        leads.forEach(l => {
            console.log(`- ${new Date(l.created_at).toLocaleTimeString()}: ${l.name} [${l.status}] (Source: ${l.source})`);
        });
    }
}

checkRecentTraffic();
