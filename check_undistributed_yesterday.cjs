const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const yesterdayStart = '2026-02-25T18:30:00Z';
    const yesterdayEnd = '2026-02-26T18:30:00Z';

    // 1. Get leads created yesterday that have NO distributed_at OR assigned_to was NULL before today
    const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterdayStart)
        .lt('created_at', yesterdayEnd)
        .is('distributed_at', null);

    console.log(`Leads created yesterday with distributed_at = NULL: ${count}`);

    // Let's see some samples if count > 0
    if (count > 0) {
        const { data: samples } = await supabase
            .from('leads')
            .select('id, name, phone, status, assigned_to')
            .gte('created_at', yesterdayStart)
            .lt('created_at', yesterdayEnd)
            .is('distributed_at', null)
            .limit(5);
        console.log('Samples:', samples);
    }
}

check();
