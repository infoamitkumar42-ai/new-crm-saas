const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    const { data: stuckLeads, error } = await supabase
        .from('leads')
        .select('name, source, status, created_at')
        .eq('status', 'Night_Backlog')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching leads:', error);
        return;
    }

    console.log(`Leads in Night_Backlog: ${stuckLeads.length}`);
    stuckLeads.forEach(l => {
        console.log(`- Lead: ${l.name} | Source: ${l.source} | Created At: ${l.created_at}`);
    });
})();
