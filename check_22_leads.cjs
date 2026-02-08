
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkExactlyWhatsInDB() {
    const today = new Date().toISOString().split('T')[0];
    console.log(`🔍 Checking exactly what is in DB for ${today}...`);

    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, name, source, status, created_at')
        .gte('created_at', today + 'T00:00:00Z');

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Total count in DB: ${leads.length}`);

    const summary = {};
    leads.forEach(l => {
        const key = `${l.status} | ${l.source}`;
        summary[key] = (summary[key] || 0) + 1;
    });

    console.log("\n--- Breakdown of the 22+ leads ---");
    Object.entries(summary).forEach(([k, v]) => console.log(`${v} leads: ${k}`));

    console.log("\n--- Full List of Leads in DB ---");
    leads.forEach((l, i) => {
        console.log(`${i + 1}. [${l.created_at}] Name: ${l.name} | Status: ${l.status} | Source: ${l.source}`);
    });
}

checkExactlyWhatsInDB();
