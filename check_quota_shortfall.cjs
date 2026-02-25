const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkQuota() {
    console.log("📊 CALCULATING REAL-TIME LEAD QUOTA STATUS...");

    // Fetch all active users
    const { data: users, error } = await supabase
        .from('users')
        .select('name, email, team_code, daily_limit, daily_limit_override, leads_today')
        .eq('payment_status', 'active')
        .eq('is_active', true);

    if (error) { console.error(error); return; }

    const report = {};
    let totalNeeded = 0;
    let totalAssigned = 0;
    let totalLimit = 0;

    users.forEach(u => {
        const team = u.team_code || 'NO_TEAM';
        const limit = u.daily_limit_override || u.daily_limit || 0;
        const assigned = u.leads_today || 0;
        const remaining = Math.max(0, limit - assigned);

        if (!report[team]) {
            report[team] = {
                members: 0,
                total_limit: 0,
                assigned_today: 0,
                pending_leads: 0
            };
        }

        report[team].members++;
        report[team].total_limit += limit;
        report[team].assigned_today += assigned;
        report[team].pending_leads += remaining;

        totalLimit += limit;
        totalAssigned += assigned;
        totalNeeded += remaining;
    });

    console.log("\n--- TEAM-WISE BREAKDOWN ---");
    console.table(report);

    console.log("\n--- SUMMARY ---");
    console.log(`👥 Total Active Users: ${users.length}`);
    console.log(`🎯 Total Daily Requirement: ${totalLimit}`);
    console.log(`✅ Total Assigned Today: ${totalAssigned}`);
    console.log(`🚨 PENDING LEADS NEEDED: ${totalNeeded}`);

    console.log("\n(Note: This includes the 7 newly reactivated users)");
}

checkQuota();
