const SUPABASE_URL = "https://api.leadflowcrm.in";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

async function analyze() {
    try {
        const usersResp = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id,name,is_active`, {
            headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
        });
        const users = await usersResp.json();
        const userMap = new Map(users.map(u => [u.id, u]));

        const leadsResp = await fetch(`${SUPABASE_URL}/rest/v1/leads?select=id,assigned_to,created_at&created_at=gte.2026-02-27T00:00:00`, {
            headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
        });
        const leads = await leadsResp.json();

        const userLeads = {};
        let nullLeads = 0;

        leads.forEach(lead => {
            const assignedTo = lead.assigned_to;
            if (!assignedTo) {
                nullLeads++;
            } else {
                const user = userMap.get(assignedTo);
                if (!user || !user.is_active) {
                    const name = user ? user.name : "Unknown/Deleted User";
                    userLeads[name] = (userLeads[name] || 0) + 1;
                }
            }
        });

        console.log("📊 Breakdown of Effective Orphans (since Feb 27th):");
        console.log(`- ❌ NULL assigned_to: ${nullLeads}`);
        Object.entries(userLeads).sort((a, b) => b[1] - a[1]).forEach(([name, count]) => {
            console.log(`- 💤 Inactive/Missing User [${name}]: ${count} leads`);
        });

    } catch (err) { console.error(err); }
}

analyze();
