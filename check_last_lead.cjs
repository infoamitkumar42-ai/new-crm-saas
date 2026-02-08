
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkLastLead() {
    console.log("🕵️‍♂️ Checking Last Created Lead...");

    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, name, phone, source, status, created_at, assigned_to')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) console.error(error);
    else {
        if (leads.length > 0) {
            console.log("✅ LATEST LEAD FOUND:");
            console.table(leads);

            // Check Assigned User
            const uId = leads[0].assigned_to;
            if (uId) {
                const { data: u } = await supabase.from('users').select('name, team_code').eq('id', uId).single();
                console.log(`👤 Assigned To: ${u?.name} (${u?.team_code})`);
            } else {
                console.log("⚠️ Not Assigned yet (Check Status)");
            }
        } else {
            console.log("❌ No leads found.");
        }
    }
}

checkLastLead();
