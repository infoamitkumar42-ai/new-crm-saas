
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const NAMES = ['Chirag Darji', 'Parth Rami (Chirag sir)'];

async function investigate() {
    console.log("🕵️ INVESTIGATING OUTLIERS...");

    // 1. Get Users Details
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, plan_name, daily_limit')
        .in('name', NAMES); // Exact match might fail if extra spaces, I'll use ilike if needed but previous script output matches exactly

    if (error) { console.error(error); return; }

    for (const user of users) {
        console.log(`\n👤 USER: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Plan: ${user.plan_name}`);
        console.log(`   Daily Limit: ${user.daily_limit}`);

        // 2. Count Yesterday (Feb 5)
        const { count: yesterday } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', user.id)
            .gte('created_at', '2026-02-05T00:00:00+05:30')
            .lt('created_at', '2026-02-06T00:00:00+05:30');

        // 3. Count Today (Feb 6)
        const { count: today } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', user.id)
            .gte('created_at', '2026-02-06T00:00:00+05:30');

        console.log(`   📅 Leads Yesterday (Feb 5): ${yesterday}`);
        console.log(`   📅 Leads Today (Feb 6):     ${today}`);
        console.log(`   📝 Total (Last 2 Days):      ${yesterday + today}`);
    }
}

investigate();
