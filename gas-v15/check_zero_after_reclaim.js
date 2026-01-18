import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkFinal() {
    console.log('\n🏁 --- FINAL ZERO CHECK (POST-REDISTRIBUTION) ---\n');

    const now = new Date().toISOString();
    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);

    // 1. Get Eligible Paid Users
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email')
        .gt('daily_limit', 0)
        .gt('valid_until', now);

    if (error) {
        console.error("Error:", error.message);
        return;
    }

    console.log(`Checking ${users.length} Eligible Paid Users...`);

    const zeroUsers = [];

    // 2. Count for each
    for (const u of users) {
        const { count } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id)
            .gte('created_at', startToday.toISOString());

        if (count === 0) {
            zeroUsers.push(u.name);
        }
    }

    // 3. Result
    console.log(`\n🚨 Active Users with 0 Leads: ${zeroUsers.length}`);
    if (zeroUsers.length > 0) {
        console.log("Names:", zeroUsers.join(", "));
    } else {
        console.log("✅ PERFECT! All active paid users have at least 1 lead.");
    }
}

checkFinal();
