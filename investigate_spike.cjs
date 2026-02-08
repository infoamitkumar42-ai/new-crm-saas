
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function investigateSpike() {
    const today = new Date().toISOString().split('T')[0];
    console.log(`🕵️ Investigating Spike: Finding all ${today} leads...\n`);

    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, name, phone, source, status, created_at, notes')
        .gte('created_at', today + 'T00:00:00Z')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("❌ Error:", error);
        return;
    }

    console.log(`Total Leads in DB Today: ${leads.length}`);

    // Group by source and name to see patterns
    const summary = {};
    leads.forEach(l => {
        const key = `${l.name} | ${l.source}`;
        summary[key] = (summary[key] || 0) + 1;
    });

    console.log("\n--- Distribution Pattern (Count | Name | Source) ---");
    Object.entries(summary).sort((a, b) => b[1] - a[1]).forEach(([pattern, count]) => {
        console.log(`${count} x ${pattern}`);
    });

    console.log("\n--- Last 10 Raw Entries ---");
    leads.slice(0, 10).forEach(l => {
        console.log(`[${l.created_at}] Name: ${l.name} | Source: ${l.source} | Status: ${l.status}`);
    });
}

investigateSpike();
