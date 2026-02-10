const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function reEnableTrigger() {
    console.log("🛡️ Re-enabling Quota Trigger...");

    const sql = `
        CREATE TRIGGER trg_check_limit_update
        BEFORE UPDATE ON leads
        FOR EACH ROW
        EXECUTE FUNCTION check_lead_limit_before_insert();
    `;

    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        if (error.message.includes('already exists')) {
            console.log("✅ Trigger already exists.");
        } else {
            console.error(`❌ Error re-enabling trigger: ${error.message}`);
        }
    } else {
        console.log("✅ Trigger re-enabled successfully.");
    }
}

reEnableTrigger();
