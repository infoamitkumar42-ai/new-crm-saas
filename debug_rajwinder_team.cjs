const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function debugRajwinderTeam() {
    const mids = ['1f4ab7b6-583d-4db8-9866-fbef457eea98', 'e47bb0a8-61de-4cac-8cf1-75048f0383a6'];

    console.log("🔍 Checking Full Team Status for Rajwinder...");

    const { data: users, error } = await supabase
        .from('users')
        .select('name, email, leads_today, last_assigned_at, is_online, is_active, payment_status')
        .in('manager_id', mids)
        .order('leads_today', { ascending: true });

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log("\nName                 | Leads | Online | Last Assigned At");
    console.log("---------------------|-------|--------|-----------------------------");
    users.forEach(u => {
        const last = u.last_assigned_at ? new Date(u.last_assigned_at).toLocaleString() : "NEVER";
        console.log(`${u.name.padEnd(20)} |   ${u.leads_today}   | ${u.is_online ? 'YES' : 'NO '}    | ${last}`);
    });

    console.log(`\nTotal Members: ${users.length}`);
    const zeroLeads = users.filter(u => u.leads_today === 0 && u.is_online).length;
    console.log(`Waiting with 0 Leads: ${zeroLeads}`);
}

debugRajwinderTeam();
