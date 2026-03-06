const SUPABASE_URL = "https://api.leadflowcrm.in";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

async function checkTeamCapacity() {
    console.log("🚀 Auditing Team Capacity (Fire & Simran)...");

    try {
        const url = `${SUPABASE_URL}/rest/v1/users?select=id,name,is_active,payment_status,total_leads_received,total_leads_promised,team_code`;
        const resp = await fetch(url, {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
        });

        if (!resp.ok) {
            const errBody = await resp.text();
            console.error(`❌ API Error (${resp.status}):`, errBody);
            return;
        }

        const users = await resp.json();
        console.log(`✅ Loaded ${users.length} users.`);

        const fireCodes = ['GJ01TEAMFIRE', 'TEAMFIRE'];
        const simranCodes = ['TEAMSIMRAN'];

        const results = {
            fire: { active: 0, pendingQuota: 0, members: [] },
            simran: { active: 0, pendingQuota: 0, members: [] }
        };

        const details = [];

        users.forEach(u => {
            const teamCode = (u.team_code || "").toUpperCase();
            const isFire = fireCodes.includes(teamCode);
            const isSimran = simranCodes.includes(teamCode);

            if (isFire || isSimran) {
                const team = isFire ? 'fire' : 'simran';
                const isActive = u.is_active && u.payment_status === 'active';
                const received = u.total_leads_received || 0;
                const promised = u.total_leads_promised || 0;
                const hasPendingQuota = received < promised;

                if (isActive) {
                    results[team].active++;
                    if (hasPendingQuota) {
                        results[team].pendingQuota++;
                        results[team].members.push({
                            name: u.name,
                            received,
                            promised,
                            remaining: promised - received,
                            teamCode: teamCode
                        });
                    }
                }
            }
        });

        console.log("\n📊 Team Capacity Results:");
        console.log(`🔥 Team Fire:`);
        console.log(`  - Active Members: ${results.fire.active}`);
        console.log(`  - Members with Pending Quota: ${results.fire.pendingQuota}`);
        if (results.fire.members.length > 0) {
            results.fire.members.sort((a, b) => b.remaining - a.remaining).forEach((m, i) => {
                console.log(`    - ${m.name}: ${m.received}/${m.promised} (Remaining: ${m.remaining}) [${m.teamCode}]`);
            });
        }

        console.log(`\n👑 Team Simran:`);
        console.log(`  - Active Members: ${results.simran.active}`);
        console.log(`  - Members with Pending Quota: ${results.simran.pendingQuota}`);
        if (results.simran.members.length > 0) {
            results.simran.members.sort((a, b) => b.remaining - a.remaining).forEach((m, i) => {
                console.log(`    - ${m.name}: ${m.received}/${m.promised} (Remaining: ${m.remaining})`);
            });
        }

    } catch (err) {
        console.error("❌ Runtime Error:", err);
    }
}

checkTeamCapacity();
