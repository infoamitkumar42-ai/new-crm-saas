import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkAssignedAt() {
    const { data: user } = await supabase.from('users').select('id').eq('email', 'samandeepkaur1216@gmail.com').single();
    if (!user) return;

    // Check leads where assigned_at is today
    const startOfDay = '2026-03-18T00:00:00+05:30';
    
    const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .or(`assigned_to.eq.${user.id},user_id.eq.${user.id}`)
        .gte('assigned_at', startOfDay);

    console.log(`Leads assigned to SAMAN since ${startOfDay} (by assigned_at): ${count}`);
    
    // Also check leads with NO assigned_at but assigned_to = user.id
    const { count: noAssignedAt } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id)
        .is('assigned_at', null);
    
    console.log(`Leads assigned to SAMAN with NULL assigned_at: ${noAssignedAt}`);
}

checkAssignedAt().catch(console.error);
