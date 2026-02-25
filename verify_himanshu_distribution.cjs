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
        .select('id, created_at, assigned_at, notes, name')
        .in('source', TARGET_SOURCES)
        .gte('assigned_at', '2026-02-21T18:30:00.000Z'); // After start of today IST

    console.log(`Verifying ${leads ? leads.length : 0} assigned leads today from these sources:`);

    let badDate = 0;
    let badNotes = 0;
    let minTime = null;
    let maxTime = null;

    leads.forEach(l => {
        if (l.notes !== null && l.notes !== '') badNotes++;

        const ist = new Date(new Date(l.created_at).getTime() + 5.5 * 60 * 60 * 1000); // UTC+5:30
        const timeStr = ist.toISOString();

        if (!minTime || ist < minTime) minTime = ist;
        if (!maxTime || ist > maxTime) maxTime = ist;

        if (timeStr.split('T')[0] !== '2026-02-22') badDate++;
    });

    console.log(`❌ Bad Dates: ${badDate}`);
    console.log(`❌ Bad Notes: ${badNotes}`);
    if (minTime && maxTime) {
        console.log(`Earliest Time (IST): ${minTime.toISOString().split('T')[1]}`);
        console.log(`Latest Time (IST): ${maxTime.toISOString().split('T')[1]}`);
    } else {
        console.log("No leads were processed or correctly dated.");
    }
}

main().catch(console.error);
