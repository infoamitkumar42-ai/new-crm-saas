
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const RAW_DATA = `job_person	Anvesh Udrala	p:+919104571837	Dahod
student	Ashvin Chauhan	p:+919099427364	Melan
job_person	Dhruv Bhavsar	p:9265812521	Ahemdabad
job_person	Milan Patel	p:8401551457	Surat
others	Suheb Kaji	p:+919714048074	mahUVA`;

async function debugLogic() {
    console.log("🐛 DEBUGGING INSERT LOGIC...");

    // Fetch ALL phones (no date filter for debug)
    const { data: dbLeads } = await supabase.from('leads').select('phone');
    const dbPhones = new Set(dbLeads.map(l => l.phone.replace(/^\+91/, '').replace(/[\s-]/g, '')));

    const lines = RAW_DATA.split('\n');

    for (const line of lines) {
        let rawPhone = line.split('\t')[2].replace('p:', '').trim().replace(/[\s-]/g, '');
        let cleanPhone = rawPhone.replace(/^\+91/, '');

        console.log(`Checking: ${cleanPhone}`);

        if (dbPhones.has(cleanPhone)) {
            console.log(`   ❌ FOUND IN DB (Duplicate)`);
        } else {
            console.log(`   ✅ NOT FOUND (Should Insert)`);
        }
    }
}

debugLogic();
