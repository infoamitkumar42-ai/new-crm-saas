const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkFreshYesterday() {
    const yesterdayStart = '2026-02-25T18:30:00Z';
    const yesterdayEnd = '2026-02-26T18:30:00Z';

    const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Fresh')
        .gte('created_at', yesterdayStart)
        .lt('created_at', yesterdayEnd);

    console.log(`'Fresh' leads created yesterday (Feb 26): ${count}`);

    // Let's also check for 'Fresh' leads created TODAY
    const { count: todayCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Fresh')
        .gte('created_at', yesterdayEnd);
    console.log(`'Fresh' leads created today (Feb 27): ${todayCount}`);
}

checkFreshYesterday();
