const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkOrphans() {
    console.log("🔍 Inspecting ORPHAN Leads (Unassigned Today)...");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: orphans, error } = await supabase
        .from('leads')
        .select('id, name, created_at, source, status')
        .is('assigned_to', null)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

    if (orphans && orphans.length > 0) {
        console.log(`❌ Found ${orphans.length} Stuck Leads:\n`);
        orphans.forEach(l => {
            console.log(`- ${l.name} (${new Date(l.created_at).toLocaleTimeString()}) [${l.source}] Status: ${l.status}`);
        });
    } else {
        console.log("✅ No orphan leads found! All assigned.");
    }
}

checkOrphans();
