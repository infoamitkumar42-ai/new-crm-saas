
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function listPages() {
    console.log("📄 Listing ALL Connected Pages & Managers...");

    const { data: pages } = await supabase.from('connected_pages').select('*');

    for (const p of pages) {
        // Get Manager Name
        let managerName = 'Unknown';
        if (p.manager_id) {
            const { data: m } = await supabase.from('users').select('name').eq('id', p.manager_id).single();
            if (m) managerName = m.name;
        }

        console.log(`\n🔹 PAGE: ${p.page_name}`);
        console.log(`   ID:      ${p.page_id}`);
        console.log(`   Manager: ${managerName} (${p.manager_id})`);
    }
}

listPages();
