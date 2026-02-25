const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const TARGET_SOURCES = [
    'Meta - Digital Skills India - By Himanshu Sharma',
    'Meta - Rajwinder FB Page 2',
    'Meta - Work With Himanshu Sharma',
    'new year ad himanshu 7/1/26'
];

async function main() {
    const { data: leads } = await supabase.from('leads')
        .select('id, created_at')
        .in('source', TARGET_SOURCES)
        .gte('created_at', '2026-02-21T18:30:00.000Z') // After 12am IST Feb 22
        .lt('created_at', '2026-02-22T00:00:00.000Z'); // Before 5:30am IST Feb 22

    if (!leads || leads.length === 0) {
        console.log("No bad dates found.");
        return;
    }

    console.log(`Fixing ${leads.length} leads that fell on yesterday UTC...`);

    let fixedCount = 0;
    for (let l of leads) {
        // Just add 6 hours to push them comfortably into Feb 22nd UTC
        const oldDate = new Date(l.created_at);
        const newDate = new Date(oldDate.getTime() + 6 * 60 * 60 * 1000).toISOString();

        const { error } = await supabase.from('leads')
            .update({ assigned_at: newDate, created_at: newDate })
            .eq('id', l.id);

        if (!error) fixedCount++;
    }

    console.log(`✅ Fixed timestamps for ${fixedCount}/${leads.length} leads!`);
}

main().catch(console.error);
