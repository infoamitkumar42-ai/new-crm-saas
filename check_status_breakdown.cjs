
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkStatusBreakdown() {
    console.log("📊 LEAD STATUS BREAKDOWN (TODAY)");
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);

    const { data: leads } = await supabase.from('leads')
        .select('status')
        .gte('created_at', startOfDay.toISOString());

    const stats = {};
    leads.forEach(l => { stats[l.status] = (stats[l.status] || 0) + 1 });
    console.table(stats);
}

checkStatusBreakdown();
