
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const SAMPLES = [
    '9023313218',
    '9327182391',
    '9979246209',
    '8980098223',
    '9724715097',
    '9601916383'
];

async function check() {
    console.log("🕵️ CHECKING STATUS OF SKIPPED LEADS...");

    const { data: leads, error } = await supabase
        .from('leads')
        .select('name, phone, assigned_to, status, created_at')
        .in('phone', SAMPLES);

    if (error) { console.error(error); return; }

    console.log(`FOUND ${leads.length} LEADS.`);

    for (const lead of leads) {
        if (lead.assigned_to) {
            console.log(`✅ ${lead.name} -> Assigned to: ${lead.assigned_to} (VISIBLE)`);
        } else {
            console.log(`❌ ${lead.name} -> UNASSIGNED (NOT VISIBLE)`);
        }
    }
}
check();
