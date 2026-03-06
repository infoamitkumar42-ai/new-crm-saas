const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data: leads, error } = await supabase
        .from('leads')
        .select('assigned_to, users(name, email)')
        .eq('source', 'Bulk-Teamfire-Feb27');

    if (error) {
        console.error(error);
        return;
    }

    const counts = {};
    leads.forEach(l => {
        const key = `${l.users.name} (${l.users.email})`;
        counts[key] = (counts[key] || 0) + 1;
    });

    console.log(JSON.stringify(counts, null, 2));
}

check();
