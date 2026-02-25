const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    const { data: users } = await supabase.from('users').select('id, name').ilike('name', '%Chirag%');
    const chiragIds = users.map(u => u.id);

    const { data: chiragLeads } = await supabase
        .from('leads')
        .select('*')
        .in('assigned_to', chiragIds)
        .order('created_at', { ascending: false })
        .limit(100);

    const freshLeads = chiragLeads.filter(l => l.status === 'Fresh');
    console.log(`Total Fresh leads for Chirag: ${freshLeads.length}`);

    // If it's exactly 17, we found them!

    // Group by status
    const statusGroups = {};
    chiragLeads.forEach(l => {
        statusGroups[l.status] = (statusGroups[l.status] || 0) + 1;
    });
    console.log("Status of last 100 leads:", statusGroups);

    // What if we look at exactly 2026-02-18?
    const feb18Leads = chiragLeads.filter(l => l.created_at.startsWith('2026-02-18'));
    console.log(`Feb 18 Leads: ${feb18Leads.length}`);
    const feb18Statuses = {};
    feb18Leads.forEach(l => feb18Statuses[l.status] = (feb18Statuses[l.status] || 0) + 1);
    console.log("Feb 18 Statuses:", feb18Statuses);
}
main().catch(console.error);
