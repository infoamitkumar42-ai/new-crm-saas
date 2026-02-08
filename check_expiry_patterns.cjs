
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkPatterns() {
    console.log("🕵️‍♂️ Analyzing Expiry Date Patterns (Himanshu Team)...");

    const { data: users } = await supabase.from('users')
        .select('valid_until')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', true)
        .not('valid_until', 'is', null);

    const dates = {};
    users.forEach(u => {
        const d = new Date(u.valid_until).toISOString().split('T')[0]; // YYYY-MM-DD
        dates[d] = (dates[d] || 0) + 1;
    });

    console.log("\n📅 Expiry Date Distribution:");
    console.table(dates);
}

checkPatterns();
