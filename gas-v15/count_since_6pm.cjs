
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function countSince6PM() {
    // 6 PM IST = 12:30 PM UTC
    const since6PM = '2026-01-18T12:30:00.000Z';

    const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', since6PM);

    console.log(`📊 Leads Generated Since 6 PM IST: ${count}`);
}

countSince6PM();
