const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    // Start of Day (12:00 AM IST -> Previous Day 18:30 UTC)
    // 2026-02-18T18:30:00.000Z
    const START_TIME_ISO = '2026-02-18T18:30:00.000Z';

    console.log(`--- 📊 CHIRAG PAGE AUDIT (Full Day) 📊 ---`);

    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, source, status, created_at')
        .ilike('source', '%Chirag%') // Case insensitive match
        .gte('created_at', START_TIME_ISO);

    if (error) { console.error(error); return; }

    console.log(`Total Leads from 'Chirag' Page Today: ${leads.length}\n`);

    // Status Breakdown
    const statusCounts = {};
    leads.forEach(l => {
        statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
    });

    console.table(statusCounts);
})();
