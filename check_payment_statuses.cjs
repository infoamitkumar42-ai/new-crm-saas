const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkStatuses() {
    console.log("🕵️ Checking Distinct Payment Statuses...");

    // Fetch all statuses
    const { data, error } = await supabase
        .from('payment_history')
        .select('status');

    if (error) { console.error(error); return; }

    const statuses = {};
    data.forEach(r => {
        const s = r.status || 'NULL';
        statuses[s] = (statuses[s] || 0) + 1;
    });

    console.log("📊 STATUS COUNTS:");
    console.table(statuses);
}

checkStatuses();
