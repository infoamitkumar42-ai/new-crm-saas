import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const targetEmails = [
    'samandeepkaur1216@gmail.com', // SAMAN
    'princyrani303@gmail.com',      // Princy
    'gurnoor1311singh@gmail.com',   // Mandeep (turbo)
    'sipreet73@gmail.com',          // Sipreet
    'sranjasnoor11@gmail.com'       // Jasnoor
];

async function checkToday() {
    console.log('--- LEADS RECEIVED TODAY (18 March 2026) ---');
    const startOfDay = '2026-03-18T00:00:00+05:30';
    
    for (const email of targetEmails) {
        const { data: user } = await supabase.from('users').select('id, name, leads_today').eq('email', email).single();
        if (!user) continue;

        const { count } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .or(`assigned_to.eq.${user.id},user_id.eq.${user.id}`)
            .gte('created_at', startOfDay);

        console.log(`${user.name} (${email}):`);
        console.log(`  leads_today counter: ${user.leads_today}`);
        console.log(`  Actual leads in DB today: ${count}`);
    }
}

checkToday().catch(console.error);
