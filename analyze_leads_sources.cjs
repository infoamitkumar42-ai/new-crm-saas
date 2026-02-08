
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function analyzeSources() {
    console.log("📊 ANALYZING LEAD SOURCES (Feb 5 - Feb 6)...");

    // Fetch all leads for Chirag's team users in window
    const { data: leads, error } = await supabase
        .from('leads')
        .select('source, created_at')
        .gte('created_at', '2026-02-05T00:00:00+05:30');

    if (error) { console.error(error); return; }

    const counts = {};
    let total = 0;

    leads.forEach(l => {
        const src = l.source || 'Unknown';
        counts[src] = (counts[src] || 0) + 1;
        total++;
    });

    console.log(`✅ Total Leads Found: ${total}`);
    console.log("-----------------------------------");
    console.log("SOURCE Breakdown:");
    console.log("-----------------------------------");

    for (const [src, count] of Object.entries(counts)) {
        console.log(`${src.padEnd(40)} | ${count}`);
    }
}

analyzeSources();
