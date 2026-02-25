const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function inspectMB() {
    console.log("🕵️ INSPECTING DATABASE STRUCTURE...");

    // 1. List Tables (Public Schema) - Using RPC ideally, but Supabase JS doesn't have direct listTables.
    // We'll try to select from a known table and get error hint, or assume 'users' works.

    // Attempt 1: Check 'payment_history' existence explicitly
    const { data: phData, error: phError } = await supabase
        .from('payment_history')
        .select('*')
        .limit(1);

    if (phError) {
        console.error("❌ 'payment_history' Error:", phError.message);
    } else {
        console.log("✅ 'payment_history' EXISTS. Sample:", phData);
    }

    // Attempt 2: Check 'payments' existence
    const { data: pData, error: pError } = await supabase
        .from('payments')
        .select('*')
        .limit(1);

    if (pError) {
        console.error("❌ 'payments' Error:", pError.message);
    } else {
        console.log("✅ 'payments' EXISTS. Sample:", pData);
    }

    // Attempt 3: Check distinct statuses if table found
    if (!phError) {
        const { data: statuses } = await supabase.from('payment_history').select('status');
        if (statuses) {
            const unique = [...new Set(statuses.map(s => s.status))];
            console.log("📊 Distinct Statuses in 'payment_history':", unique);
        }
    }
}

inspectMB();
