const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    const { data: users } = await supabase.from('users').select('id, name').ilike('name', '%Prabhjeet%');
    const prabhjeetId = users[0].id;

    const { data: leads } = await supabase
        .from('leads')
        .select('id, name, source, assigned_to, created_at, status')
        .eq('assigned_to', prabhjeetId)
        .order('assigned_at', { ascending: false })
        .limit(20);

    fs.writeFileSync('prabhjeet_leads.json', JSON.stringify(leads, null, 2));
    console.log("Saved to prabhjeet_leads.json");
}

main().catch(console.error);
