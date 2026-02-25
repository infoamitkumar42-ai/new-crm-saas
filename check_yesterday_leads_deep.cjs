const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    console.log("🔍 Looking for any manually distributed leads or CSV imports for 19th Feb...\n");

    const yesterdayStart = '2026-02-19T00:00:00.000Z';
    const yesterdayEnd = '2026-02-19T23:59:59.999Z';

    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, name, created_at, source, assigned_to, status, phone')
        .gte('created_at', yesterdayStart)
        .lte('created_at', yesterdayEnd)
        .ilike('source', '%Himanshu%')
        .order('created_at', { ascending: true })
        .limit(10); // Check the first 10 just to see if they look organically created

    if (leads && leads.length > 0) {
        console.log("Here are the very first 5 leads created yesterday for Himanshu:");
        leads.slice(0, 5).forEach(l => console.log(` - ${l.created_at} | ${l.name} | ${l.source} | ${l.status}`));
    }
}

main().catch(console.error);
