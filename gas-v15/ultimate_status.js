import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function ultimateStatus() {
    const { data: users } = await supabase
        .from('users')
        .select('name, leads_today')
        .gt('leads_today', 0)
        .order('leads_today', { ascending: false });

    const { count: orphans } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .is('user_id', null);

    const total = users.reduce((sum, u) => sum + (u.leads_today || 0), 0);

    console.log('\n🎯 ULTIMATE FINAL STATUS:\n');
    console.log(`Total users with leads: ${users.length}`);
    console.log(`Total leads assigned: ${total}`);
    console.log(`Orphans remaining: ${orphans}\n`);

    console.log('All users:\n');
    console.table(users);
}

ultimateStatus();
