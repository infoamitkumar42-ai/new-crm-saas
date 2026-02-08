
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function diagnoseChirag() {
    console.log("🕵️‍♂️ Finding ALL users named 'Chirag'...");

    const { data: users } = await supabase
        .from('users')
        .select('id, name, email, plan_name, daily_limit, leads_today, is_active')
        .ilike('name', '%Chirag%');

    if (!users || users.length === 0) {
        console.log("❌ No user found with name Chirag.");
        return;
    }

    console.table(users);

    for (const u of users) {
        // Count actual leads in DB
        const { count } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id);

        console.log(`\n👤 ${u.name} (${u.email}):`);
        console.log(`   - Dashboard leads_today: ${u.leads_today}`);
        console.log(`   - ACTUAL DB Lead Count: ${count}`);
        console.log(`   - Plan: ${u.plan_name}`);
    }
}

diagnoseChirag();
