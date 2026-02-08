
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkOrphans() {
    console.log("🕵️‍♂️ Hunting for Queue/Orphan Leads...");

    // Check for Status = 'New' OR 'Orphan' OR 'Undelivered'
    const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .or('status.eq.New,status.eq.Orphan,status.eq.Undelivered')
        .order('created_at', { ascending: false });

    if (!leads || leads.length === 0) {
        console.log("✅ No Orphan/Queue leads found in DB.");
    } else {
        console.log(`⚠️ FOUND ${leads.length} LEADS IN QUEUE:`);
        console.table(leads.map(l => ({
            Name: l.name,
            Phone: l.phone,
            Source: l.source,
            Status: l.status,
            Time: new Date(l.created_at).toLocaleTimeString()
        })));

        // AUTO FIX ATTEMPT
        console.log("\n🚑 Attempting to distribute found orphans...");
        // Logic: Give to TEAMFIRE (Default) or based on Source
        // ... (We will wait for user confirmation before auto-assigning)
    }
}

checkOrphans();
