import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifyFinal() {
    console.log('\n🕵️ --- FINAL PROOF: MANUAL ASSIGNMENTS ---\n');

    const targets = ['Rajwinder Singh', 'Sandeep', 'Gurnam', 'Rajni'];

    // We can fetch by name or email. Let's fetch IDs first to be safe.
    // Based on previous logs:
    // Rajwinder Singh, Sandeep, Gurnam, Rajni (names matched)

    const { data: users } = await supabase
        .from('users')
        .select('id, name')
        .in('name', targets);

    if (!users) { console.log("Users not found"); return; }

    for (const u of users) {
        console.log(`👤 USER: ${u.name}`);

        // Count leads assigned today
        const startToday = new Date();
        startToday.setHours(0, 0, 0, 0);

        const { count, data: leads } = await supabase
            .from('leads')
            .select('name', { count: 'exact' })
            .eq('assigned_to', u.id)
            .gte('assigned_at', startToday.toISOString()) // Check assignment time (fresh)
            .order('assigned_at', { ascending: false })
            .limit(5); // Show last 5

        console.log(`   🔢 Total Assigned Today: ${count}`);
        console.log(`   📝 Recent Leads:`);
        leads.forEach(l => console.log(`      - ${l.name}`));
        console.log('-------------------------------------------');
    }
}

verifyFinal();
