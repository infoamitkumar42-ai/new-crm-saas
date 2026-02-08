
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkProgress() {
    console.log("🕵️ CHECKING RESTORATION PROGRESS...");

    const { count, error } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .ilike('notes', '%[System]: Restored%');

    if (error) { console.error(error); return; }

    console.log(`✅ RESTORED SO FAR: ${count} LEADS.`);
}

checkProgress();
