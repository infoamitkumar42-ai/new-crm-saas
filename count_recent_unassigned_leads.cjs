const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log(`--- 🔍 UNASSIGNED LEADS AUDIT (Yesterday & Today) 🔍 ---`);

    // Start of Yesterday (Feb 19, 2026 IST) -> Feb 18, 18:30 UTC
    // Let's use exactly 48 hours ago just to be safe, or start of yesterday.
    const START_TIME_ISO = '2026-02-18T18:30:00.000Z';

    console.log(`Checking leads created after: ${START_TIME_ISO} (Start of yesterday in IST)\n`);

    const { data: orphans, error } = await supabase
        .from('leads')
        .select('id, source, created_at, status')
        .eq('status', 'Orphan')
        .gte('created_at', START_TIME_ISO);

    if (error) {
        console.error("Error fetching leads:", error);
        return;
    }

    console.log(`Total Unassigned (Orphan) Leads: ${orphans.length}\n`);

    // Breakdown by source
    const sourceBreakdown = {};
    orphans.forEach(lead => {
        const src = lead.source ? lead.source.replace('Meta - ', '').trim() : 'Unknown';
        sourceBreakdown[src] = (sourceBreakdown[src] || 0) + 1;
    });

    console.log('--- Breakdown by Page ---');
    console.table(sourceBreakdown);
})();
