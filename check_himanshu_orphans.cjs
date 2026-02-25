const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {

    // We want ALL orphans from today (Since 6 AM is safe for "today")
    // Or just all orphans? Let's assume all orphans are fair game if they are recent.
    // Let's stick to "Today" to avoid zombie leads.
    const START_TIME_ISO = '2026-02-18T18:30:00.000Z'; // 12 AM IST

    console.log(`--- 🔥 HIMANSHU ORPHAN AUDIT (Today) 🔥 ---`);
    console.log(`Time Filter: >= ${START_TIME_ISO}\n`);

    // 1. Fetch Orphans
    const { data: orphans, error } = await supabase
        .from('leads')
        .select('id, name, source, created_at')
        .eq('status', 'Orphan')
        // We look for Himanshu specific keywords or exclude known others
        // Better to include known Himanshu pages: 'Digital Skills India', 'Himanshu Sharma'
        // Or simple ILIKE '%Himanshu%' OR '%Digital Skills%'
        .or('source.ilike.%Himanshu%,source.ilike.%Digital Skills%')
        .gte('created_at', START_TIME_ISO);

    if (error) { console.error(error); return; }

    console.log(`Total Himanshu Orphans Today: ${orphans.length}\n`);

    // 2. Source Breakdown
    const sourceCounts = {};
    orphans.forEach(l => {
        // Clean source name
        const src = l.source.replace('Meta - ', '').trim();
        sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    });

    console.log(`--- SOURCE BREAKDOWN ---`);
    console.table(sourceCounts);

})();
