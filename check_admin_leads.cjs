const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkAdminLeads() {
    // 1. Get all admins
    const { data: admins } = await supabase.from('users').select('id, name').eq('role', 'admin');

    if (admins && admins.length > 0) {
        console.log(`Found ${admins.length} admins. Checking their leads...`);
        for (const admin of admins) {
            const { count } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('assigned_to', admin.id);
            console.log(`Admin ${admin.name} (${admin.id}) has ${count} leads.`);
        }
    } else {
        console.log('No admins found.');
    }
}
checkAdminLeads();
