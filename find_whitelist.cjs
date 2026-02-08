
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function findYesterdayManuals() {
    console.log("🕵️‍♂️ Finding users manually activated on Feb 4...");

    // Fetch users updated yesterday with no online payment
    const { data: users } = await supabase.from('users')
        .select('id, name, email, updated_at, is_active')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', true)
        .gte('updated_at', '2026-02-04T00:00:00') // Updated since yesterday
        .lte('updated_at', '2026-02-05T00:00:00');

    if (!users) return;

    for (const u of users) {
        // Check if they have an online payment
        const { count } = await supabase.from('payments')
            .select('*', { count: 'exact', head: true })
            .or(`user_id.eq.${u.id},user_email.eq.${u.email}`)
            .eq('status', 'captured');

        if (count === 0) {
            console.log(`⚪️ WHITELIST (Manual Yesterday): ${u.name} (${u.email})`);
        }
    }
}

findYesterdayManuals();
