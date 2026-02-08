
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function findDropped() {
    console.log("🕵️‍♂️ SEARCHING FOR UNASSIGNED / DROPPED CHIRAG LEADS TODAY...");

    const today = new Date().toISOString().split('T')[0];

    // Search for leads that were NOT assigned to anyone but came from FB
    const { data: leads } = await supabase.from('leads')
        .select('id, source, status, assigned_to')
        .or('source.ilike.%chirag%,source.ilike.%bhumit%,source.ilike.%facebook%')
        .is('assigned_to', null)
        .gte('created_at', today + 'T00:00:00');

    if (leads && leads.length > 0) {
        console.log(`🚨 FOUND ${leads.length} UNASSIGNED LEADS!`);
        console.table(leads);
    } else {
        console.log("❌ NO UNASSIGNED LEADS FOUND. They simply didn't reach the Database.");
    }
}

findDropped();
