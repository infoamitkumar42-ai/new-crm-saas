import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifyRestoration() {
    console.log('\n✅ --- VERIFYING RESTORED DATA ---\n');

    // 1. Count Total Leads
    const { count: total } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });

    // 2. Count Assigned Leads (user_id is not null)
    const { count: assigned } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .not('user_id', 'is', null);

    // 3. Count Orphan Leads
    const { count: orphans } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .is('user_id', null);

    console.log(`Total Leads:    ${total}`);
    console.log(`Assigned Leads: ${assigned}`);
    console.log(`Orphan Leads:   ${orphans}`);

    // 4. Sample Check
    const { data: sample } = await supabase
        .from('leads')
        .select('id, name, user_id, assigned_to, created_at, assigned_at')
        .not('user_id', 'is', null)
        .limit(5);

    if (sample && sample.length > 0) {
        console.log('\nSample Restored Assignments:');
        sample.forEach(l => {
            console.log(`- ${l.name} -> User: ${l.user_id} (Assigned: ${l.assigned_at})`);
        });
        console.log('\n✅ Data looks populated! (Timestamps should be old)');
    } else {
        console.log('\n❌ No assignments found! Restoration might have failed or backup was empty.');
    }
}

verifyRestoration();
