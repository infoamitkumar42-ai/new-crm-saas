
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkDupes() {
    console.log("🕵️‍♂️ Checking for Duplicates Today...");

    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);

    // Fetch Duplicate Leads or potentially rejected ones
    const { data: leads } = await supabase.from('leads')
        .select('source, status')
        .eq('status', 'Duplicate')
        .gte('created_at', startOfDay.toISOString());

    console.log(`\n🗑️ Total DUPLICATE Leads Today: ${leads.length}`);

    // Breakdown
    const sources = {};
    leads.forEach(x => { sources[x.source] = (sources[x.source] || 0) + 1 });
    console.table(sources);
}

checkDupes();
