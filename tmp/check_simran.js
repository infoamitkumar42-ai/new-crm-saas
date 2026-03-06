const SUPABASE_URL = "https://api.leadflowcrm.in";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

async function checkSimran() {
    try {
        const url = `${SUPABASE_URL}/rest/v1/users?select=name,is_active,payment_status,total_leads_received,total_leads_promised,team_code&team_code=eq.TEAMSIMRAN`;
        const resp = await fetch(url, {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
        });
        const users = await resp.json();

        console.log("👑 Full TEAMSIMRAN Member List:");
        users.forEach(u => {
            console.log(`- ${u.name} | Active: ${u.is_active} | Payment: ${u.payment_status} | Quota: ${u.total_leads_received}/${u.total_leads_promised}`);
        });

    } catch (err) { console.error(err); }
}

checkSimran();
