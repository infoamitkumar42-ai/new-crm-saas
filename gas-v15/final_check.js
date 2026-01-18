import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function finalCheck() {
    // Users with leads
    const { data: users } = await supabase
        .from('users')
        .select('name, leads_today')
        .gt('leads_today', 0)
        .order('leads_today', { ascending: false });

    // Orphans
    const { count: orphans } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .is('user_id', null);

    // Leads with assigned_to = user_id (properly restored)
    const { count: restored } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .not('user_id', 'is', null)
        .not('assigned_to', 'is', null);

    console.log('\n📊 FINAL STATUS:\n');
    console.log(`Users with leads: ${users.length}`);
    console.log(`Total leads assigned: ${users.reduce((sum, u) => sum + (u.leads_today || 0), 0)}`);
    console.log(`Orphan leads: ${orphans}`);
    console.log(`Properly restored (user_id = assigned_to): ${restored}\n`);

    console.log('Top 20 users:\n');
    console.table(users.slice(0, 20));
}

finalCheck();
