
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function verifySafety() {
    console.log("🕵️‍♂️ Checking for users updated on Feb 4 (Possible Manual Renewals)...");

    const { data: users } = await supabase.from('users')
        .select('id, name, email, updated_at, is_active')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', true)
        .gte('updated_at', '2026-02-04T00:00:00'); // Check everything from Feb 4 onwards

    if (!users || users.length === 0) {
        console.log("No users were updated since yesterday.");
        return;
    }

    console.log(`\nFound ${users.length} users updated since yesterday. Checking if they match the 'Over-leaded' list...`);

    users.forEach(u => {
        console.log(`- ${u.name.padEnd(20)} | ${u.updated_at}`);
    });
}

verifySafety();
