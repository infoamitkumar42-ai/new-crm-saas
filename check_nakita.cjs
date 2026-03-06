const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkNakita() {
    const { data: user } = await supabase.from('users').select('*').eq('email', 'nakitarani74@gmail.com').single();
    console.log('Nakita Details:', user);

    // Count her leads from yesterday
    const { count } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('assigned_to', user.id).gte('created_at', '2026-02-25T18:30:00Z').lt('created_at', '2026-02-26T18:30:00Z');
    console.log(`Nakita leads from yesterday: ${count}`);
}
checkNakita();
