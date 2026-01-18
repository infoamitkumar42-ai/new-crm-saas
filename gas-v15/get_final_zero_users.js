import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkFinalZero() {
    console.log('\n⚖️ --- FINAL ZERO LEAD CHECK (DB TRUTH) ---\n');

    // 1. Get ALL Active Users
    // (Valid Until > Now AND Daily Limit > 0)
    const now = new Date().toISOString();

    const { data: activeUsers, error } = await supabase
        .from('users')
        .select('id, name, email, daily_limit')
        .gt('valid_until', now)
        .gt('daily_limit', 0);

    if (error) {
        console.error("User Fetch Error:", error.message);
        return;
    }

    console.log(`Checking ${activeUsers.length} Active Users...`);

    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);
    const startIso = startToday.toISOString();

    const realZeroUsers = [];

    // 2. Check Assignments for Each
    // We can use a group by query for efficiency, but loop is fine for precision debugging
    for (const u of activeUsers) {
        const { count, error: countError } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id)
            .gte('created_at', startIso);

        if (count === 0) {
            realZeroUsers.push({ name: u.name, email: u.email, id: u.id });
        }
    }

    // 3. Report
    console.log(`\n🚨 FOUND ${realZeroUsers.length} ACTIVE USERS WITH 0 LEADS:`);
    if (realZeroUsers.length > 0) {
        realZeroUsers.forEach(u => {
            console.log(`- ${u.name} (${u.email})`);
        });
    } else {
        console.log("✅ Good News: All active users have received at least 1 lead.");
    }
}

checkFinalZero();
