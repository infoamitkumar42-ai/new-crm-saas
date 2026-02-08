
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function verify() {
    console.log("🔍 Checking if 'Anvesh Udrala' exists in DB...");

    const { data } = await supabase.from('leads')
        .select('*')
        .ilike('name', '%Anvesh Udrala%');

    console.log(data);

    if (data && data.length > 0) {
        console.log("✅ Data IS Inserted.");
    } else {
        console.log("❌ Data is MISSING.");
    }
}

verify();
