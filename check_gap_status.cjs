
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const SAMPLES = [
    '9023313218', // @k@sh
    '9327182391', // Deep Joshi
    '9979246209', // Sima
    '8980098223', // kishuu
    '9724715097', // Doli Kotak
    '9601916383'  // Ramadhani
];

async function check() {
    console.log("🕵️ CHECKING STATUS OF SKIPPED 'DUPLICATE' LEADS...");

    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, name, phone, assigned_to, status, created_at, users(name)')
        .in('phone', SAMPLES);

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`FOUND ${leads.length} MATCHING LEADS.`);

    for (const lead of leads) {
        let assignedInfo = "❌ UNASSIGNED (Hidden?)";

        if (lead.assigned_to) {
            // Check if user exists (relation join handled by users(name)?)
            // Supabase join syntax: select('..., users:assigned_to(name)')
            // But I did standard select. I'll fetch name if 'users' is null
            let ownerName = lead.users ? lead.users.name : 'Unknown User';
            assignedInfo = `✅ ASSIGNED TO: ${ownerName} (${lead.assigned_to})`;
        }

        console.log(`\n📞 ${lead.name} (${lead.phone})`);
        console.log(`   Status: ${lead.status}`);
        console.log(`   Owner: ${assignedInfo}`);
        console.log(`   Created: ${lead.created_at}`);
    }
}

check();
