const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function finalAudit() {
    console.log("🔍 FINAL DISTRIBUTION AUDIT - FEB 9 (IST)");

    // Determine Today's start in IST (UTC+5:30)
    // 12:00 AM IST today is 6:30 PM UTC yesterday Feb 8
    const startOfTodayIST = new Date();
    startOfTodayIST.setHours(0, 0, 0, 0); // Local midnight

    const { data: leads, error: leadError } = await supabase
        .from('leads')
        .select('name, created_at, assigned_to, source, status')
        .gte('created_at', startOfTodayIST.toISOString())
        .order('created_at', { ascending: false });

    if (leadError) {
        console.error("Error:", leadError);
        return;
    }

    console.log(`✅ Leads Generated Today (Since 12:00 AM IST): ${leads.length}`);

    if (leads.length > 0) {
        // Group by Team and User
        const { data: users } = await supabase
            .from('users')
            .select('id, name, team_code, role');

        const userMap = {};
        const teamMap = {};
        users.forEach(u => {
            userMap[u.id] = u;
            if (!teamMap[u.team_code]) teamMap[u.team_code] = { name: u.team_code, leads: 0, members: {} };
        });

        leads.forEach(l => {
            if (l.assigned_to) {
                const user = userMap[l.assigned_to];
                if (user) {
                    teamMap[user.team_code].leads++;
                    teamMap[user.team_code].members[user.name] = (teamMap[user.team_code].members[user.name] || 0) + 1;
                }
            }
        });

        console.log("\n👥 DISTRIBUTION BY TEAM:");
        Object.keys(teamMap).forEach(teamCode => {
            if (teamMap[teamCode].leads > 0) {
                console.log(`📍 Team ${teamCode}: ${teamMap[teamCode].leads} leads`);
                Object.keys(teamMap[teamCode].members).forEach(m => {
                    console.log(`   - ${m}: ${teamMap[teamCode].members[m]}`);
                });
            }
        });

        // Latest Lead
        const latest = leads[0];
        const istTime = new Date(latest.created_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
        console.log(`\n🕒 Latest Activity: ${latest.name} received at ${istTime}`);
    } else {
        console.log("\n⚠️ Note: No New leads recorded in DB for Feb 9 yet.");
        console.log("   (If ads are running, check Meta Webhook status)");
    }

    // Integrity Check: Managers with leads_today > 0
    const { data: managers } = await supabase
        .from('users')
        .select('name, leads_today')
        .eq('role', 'manager')
        .gt('leads_today', 0);

    if (managers && managers.length > 0) {
        console.log("\n⚠️ ALERT: Some managers still have leads_today > 0:");
        managers.forEach(m => console.log(`   - ${m.name}: ${m.leads_today}`));
    } else {
        console.log("\n✅ Manager Isolation: 100% SUCCESS (No managers receiving leads).");
    }
}

finalAudit();
