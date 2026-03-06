const SUPABASE_URL = "https://api.leadflowcrm.in";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

async function checkTeamFire() {
    console.log("🔥 Checking Team Fire Pending Leads...");

    try {
        const url = `${SUPABASE_URL}/rest/v1/users?select=name,is_active,payment_status,total_leads_received,total_leads_promised,team_code&team_code=in.("TEAMFIRE","GJ01TEAMFIRE")&is_active=eq.true&payment_status=eq.active`;
        const resp = await fetch(url, {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
        });

        const users = await resp.json();
        let totalPending = 0;
        let membersWithPending = 0;

        console.log("\n👤 Active Team Fire Members & Quota Status:");
        users.forEach(u => {
            const received = u.total_leads_received || 0;
            const promised = u.total_leads_promised || 0;
            const pending = Math.max(0, promised - received);

            if (pending > 0) {
                totalPending += pending;
                membersWithPending++;
                console.log(`✅ ${u.name.padEnd(20)} | Quota: ${received}/${promised} | PENDING: ${pending} [${u.team_code}]`);
            } else {
                console.log(`⚪ ${u.name.padEnd(20)} | Quota: ${received}/${promised} | COMPLETE [${u.team_code}]`);
            }
        });

        console.log("\n📈 SUMMARY:");
        console.log(`- Total Active Members: ${users.length}`);
        console.log(`- Members waiting for leads: ${membersWithPending}`);
        console.log(`- Total Leads Pending in Team Fire: ${totalPending}`);

    } catch (err) {
        console.error("❌ Error:", err);
    }
}

checkTeamFire();
