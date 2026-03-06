const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data: leads } = await supabase.from('leads').select('assigned_to').eq('source', 'Bulk-Teamfire-Feb27');
    const { data: users } = await supabase.from('users').select('id, name, email');

    const userMap = {};
    users.forEach(u => userMap[u.id] = `${u.name} (${u.email})`);

    const counts = {};
    leads.forEach(l => {
        const name = userMap[l.assigned_to] || 'Unknown';
        counts[name] = (counts[name] || 0) + 1;
    });

    console.log(JSON.stringify(counts, null, 2));
}

check();
