const SUPABASE_URL = "https://api.leadflowcrm.in";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

async function analyze() {
    console.log("🚀 Starting Orphan Lead Analysis...");

    try {
        // 1. Fetch all users
        const usersResp = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id,name,is_active,payment_status`, {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
        });
        const users = await usersResp.json();
        const userMap = new Map(users.map(u => [u.id, u]));
        console.log(`✅ Loaded ${users.length} users.`);

        // 2. Fetch leads created since Feb 27th (approx 842 records)
        const leadsResp = await fetch(`${SUPABASE_URL}/rest/v1/leads?select=id,assigned_to,created_at&created_at=gte.2026-02-27T00:00:00`, {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
        });
        const leads = await leadsResp.json();
        console.log(`✅ Loaded ${leads.length} leads created since Feb 27th.`);

        let nullAssigned = 0;
        let userNotFound = 0;
        let inactiveUser = 0;
        let unpaidUser = 0;
        const orphanDetails = [];

        leads.forEach(lead => {
            const assignedTo = lead.assigned_to;
            if (!assignedTo) {
                nullAssigned++;
                orphanDetails.push({ id: lead.id, reason: "NULL assigned_to", date: lead.created_at });
            } else {
                const user = userMap.get(assignedTo);
                if (!user) {
                    userNotFound++;
                    orphanDetails.push({ id: lead.id, reason: `User ${assignedTo} not found`, date: lead.created_at });
                } else if (!user.is_active) {
                    inactiveUser++;
                    orphanDetails.push({ id: lead.id, reason: `Assigned to Inactive user (${user.name})`, date: lead.created_at });
                } else if (user.payment_status !== 'active') {
                    unpaidUser++;
                    // Optional: some people might consider this an orphan state if leads are not being delivered
                }
            }
        });

        console.log("\n📊 Analysis Results:");
        console.log(`- ❌ NULL assigned_to: ${nullAssigned}`);
        console.log(`- ⚠️ Assigned to non-existent user: ${userNotFound}`);
        console.log(`- 💤 Assigned to INACTIVE user: ${inactiveUser}`);
        console.log(`- 💸 Assigned to UNPAID user: ${unpaidUser}`);

        const totalStrictOrphans = nullAssigned + userNotFound;
        const totalEffectiveOrphans = totalStrictOrphans + inactiveUser;
        console.log(`\n➡️ Total Strict Orphans (No User): ${totalStrictOrphans}`);
        console.log(`➡️ Total Effective Orphans (No Active User): ${totalEffectiveOrphans}`);

        // Group by date to see the "parso" peak
        const countsByDate = {};
        orphanDetails.forEach(o => {
            const date = o.date.split('T')[0];
            countsByDate[date] = (countsByDate[date] || 0) + 1;
        });

        console.log("\n📅 Orphan creation dates:");
        Object.entries(countsByDate).sort().forEach(([date, count]) => {
            console.log(`${date}: ${count} orphans`);
        });

    } catch (err) {
        console.error("❌ Error analyzer:", err);
    }
}

analyze();
