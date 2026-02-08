
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function debugUnassigned() {
    console.log("🕵️‍♂️ DEBUGGING ASSIGNED_TO VALUES...\n");

    const { data: leads } = await supabase.from('leads')
        .select('assigned_to')
        .gte('created_at', '2026-01-01T00:00:00')
        .limit(1000);

    const distinct = {};
    leads.forEach(l => {
        const val = l.assigned_to;
        const key = val === null ? 'NULL' : (val === '' ? 'EMPTY_STRING' : val);
        distinct[key] = (distinct[key] || 0) + 1;
    });

    console.table(distinct);
}

debugUnassigned();
