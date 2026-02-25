const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

const HIMANSHU_KEYWORDS = ['TFE 6444', 'Himanshu Sharma', 'Work With Himanshu', 'Digital Skills India'];

(async () => {
    console.log('--- 🔍 FULL RECONCILIATION: HIMANSHU LEADS (Feb 18 & 19) ---');

    const { data: leads, error } = await supabase
        .from('leads')
        .select('status, source, created_at')
        .gte('created_at', '2026-02-18T00:00:00Z');

    if (error) {
        console.error('Error:', error);
        return;
    }

    const hLeads = leads.filter(l => l.source && HIMANSHU_KEYWORDS.some(k => l.source.includes(k)));

    const statusCounts = {};
    hLeads.forEach(l => {
        statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
    });

    console.log(`\nTOTAL LEADS FOUND: ${hLeads.length}`);
    console.log('\n--- Status Breakdown ---');
    console.table(statusCounts);

    // Check for "Very Fresh" leads (Last 30 mins)
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    const freshLeads = hLeads.filter(l => new Date(l.created_at) > thirtyMinsAgo);

    console.log(`\nFresh Leads (Last 30 mins): ${freshLeads.length}`);
    freshLeads.forEach(l => {
        console.log(`- Time: ${new Date(l.created_at).toLocaleTimeString()} | Status: ${l.status}`);
    });

    if (statusCounts['Night_Backlog'] > 0) {
        console.log(`\nNote: Found ${statusCounts['Night_Backlog']} leads still in Night_Backlog.`);
    }

})();
