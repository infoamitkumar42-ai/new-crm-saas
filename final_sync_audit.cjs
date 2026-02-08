
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function finalSyncAudit() {
    const today = new Date().toISOString().split('T')[0];
    console.log(`📊 FINAL SYNC AUDIT - ${today}`);

    const { data: leads, error } = await supabase
        .from('leads')
        .select('name, source, status, assigned_to, created_at')
        .gte('created_at', today + 'T00:00:00Z')
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    const testNames = ['Himanshu Golden Verification', 'Himanshu Success Verification', '.', '...'];
    const realLeads = leads.filter(l => !testNames.includes(l.name.trim()));
    const testLeads = leads.filter(l => testNames.includes(l.name.trim()));

    console.log(`\nTotal leads in DB: ${leads.length}`);
    console.log(`Real leads (excluding my 4 tests): ${realLeads.length}`);
    console.log(`Test leads specifically: ${testLeads.length}`);

    // Breakdown by source
    const sourceBreakdown = {};
    realLeads.forEach(l => {
        sourceBreakdown[l.source] = (sourceBreakdown[l.source] || 0) + 1;
    });

    console.log("\n--- REAL LEADS SOURCE BREAKDOWN ---");
    Object.entries(sourceBreakdown).forEach(([src, count]) => {
        console.log(`${count} leads from: ${src}`);
    });

    // Verify Rajwinder Assignment
    console.log("\n--- RAJWINDER LEADS ASSIGNMENT CHECK ---");
    const rajLeads = realLeads.filter(l => l.source === 'rajwinder ad new');
    for (const lead of rajLeads) {
        const { data: user } = await supabase.from('users').select('name, team_code').eq('id', lead.assigned_to).single();
        console.log(`Lead: ${lead.name} | Assigned To: ${user?.name} (Team: ${user?.team_code})`);
    }
}

finalSyncAudit();
