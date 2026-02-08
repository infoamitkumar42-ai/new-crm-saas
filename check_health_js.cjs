
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkHealth() {
    console.log("🏥 SYSTEM HEALTH CHECK (Last 24 Hours)");

    // Check Status Distribution
    const { data: statusData, error } = await supabase
        .from('leads')
        .select('status')
        .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) {
        console.error("Error:", error);
        return;
    }

    const counts = {};
    statusData.forEach(l => counts[l.status] = (counts[l.status] || 0) + 1);
    console.table(counts);

    // Check for Orphans (Status 'New' meant for distribution but stuck)
    const { count: orphanCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'New');

    console.log(`\n⚠️ Startling LEADS (Status: 'New'): ${orphanCount}`);
    if (orphanCount > 0) {
        console.log("   -> These might be from Unknown Pages or Quota Full.");
    }
}

checkHealth();
