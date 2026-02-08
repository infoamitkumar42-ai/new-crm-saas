
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkRajwinderSetup() {
    console.log("--- Mapped Pages for TEAMRAJ ---");
    const { data: pages } = await supabase.from('meta_pages').select('page_id, page_name, team_id');
    pages.filter(p => p.team_id === 'TEAMRAJ').forEach(p => {
        console.log(`ID: ${p.page_id} | Name: ${p.page_name} | Team: ${p.team_id}`);
    });

    console.log("\n--- 'New' or 'Unknown' Leads Today ---");
    const today = new Date().toISOString().split('T')[0];
    const { data: leads } = await supabase.from('leads')
        .select('id, name, source, status, notes, created_at')
        .gte('created_at', today + 'T00:00:00Z');

    leads.filter(l => l.status === 'New' || (l.source && l.source.includes('Unknown'))).forEach(l => {
        console.log(`[${l.created_at}] Name: ${l.name} | Status: ${l.status} | Source: ${l.source} | Notes: ${l.notes}`);
    });
}

checkRajwinderSetup();
