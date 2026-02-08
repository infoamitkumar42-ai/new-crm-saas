const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkMismatch() {
    console.log("🔍 Checking for Lead discrepancies (user_id vs assigned_to)...");

    // Fetch all assigned leads
    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, name, user_id, assigned_to')
        .not('assigned_to', 'is', null);

    if (error) {
        console.error("Error:", error);
        return;
    }

    let mismatchCount = 0;
    let nullUserCount = 0;

    leads.forEach(l => {
        if (!l.user_id) {
            nullUserCount++;
            console.log(`⚠️ Lead ${l.id} (${l.name}): assigned_to=${l.assigned_to}, user_id=NULL`);
        } else if (l.user_id !== l.assigned_to) {
            mismatchCount++;
            console.log(`❌ Lead ${l.id} (${l.name}): assigned_to=${l.assigned_to} != user_id=${l.user_id}`);
        }
    });

    console.log("\n📊 SUMMARY:");
    console.log(`Total Assigned Leads Scanned: ${leads.length}`);
    console.log(`NULL user_id (Invisible before fix): ${nullUserCount}`);
    console.log(`MISMATCH user_id (Wrong user before fix): ${mismatchCount}`);

    if (nullUserCount + mismatchCount > 0) {
        console.log("✅ The Dashboard Fix SHOULD reveal these leads now!");
    } else {
        console.log("✅ Data looks clean. The fix is good for prevention, but no current leads were hidden.");
    }
}

checkMismatch();
