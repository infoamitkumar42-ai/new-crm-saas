import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkSamanLeads() {
    const { data: user } = await supabase.from('users').select('id').eq('email', 'samandeepkaur1216@gmail.com').single();
    if (!user) return;

    const { data: leads } = await supabase
        .from('leads')
        .select('id, created_at, assigned_at, status, user_id, assigned_to')
        .or(`assigned_to.eq.${user.id},user_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(300);

    if (leads) {
        console.log(`Common dates for ${leads.length} leads:`);
        const dates = leads.map(l => l.created_at.split('T')[0]);
        const counts = {};
        dates.forEach(d => counts[d] = (counts[d] || 0) + 1);
        console.table(counts);

        console.log('\nSample latest 5:');
        console.table(leads.slice(0, 5));
    }
}

checkSamanLeads().catch(console.error);
