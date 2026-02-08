
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkPendingQuota() {
    console.log("🔥 CHECKING PENDING QUOTA FOR ALL ACTIVE TEAMS (5:30 PM STATUS)...\n");

    const { data: users } = await supabase.from('users')
        .select('name, team_code, daily_limit, leads_today, plan_name')
        .eq('is_active', true)
        .gt('daily_limit', 0);

    if (!users) return console.log("No active users.");

    let totalPending = 0;
    const teamStats = {};
    const unassignedLeadsCount = await getUnassignedCount();

    users.forEach(u => {
        const pending = Math.max(0, u.daily_limit - u.leads_today);
        if (pending > 0) {
            totalPending += pending;

            const team = u.team_code || 'No Team';
            if (!teamStats[team]) teamStats[team] = { pending: 0, users: 0, top_tier_pending: 0 };

            teamStats[team].pending += pending;
            teamStats[team].users++;

            // Check if top tier (limit > 10)
            if (u.daily_limit > 10) {
                teamStats[team].top_tier_pending += pending;
            }
        }
    });

    console.log("📊 TEAM-WISE PENDING DEMAND:");
    console.table(Object.entries(teamStats).map(([team, stat]) => ({
        Team: team,
        'Users Waiting': stat.users,
        'Total Leads Needed': stat.pending,
        'Top Tier Demand': stat.top_tier_pending
    })));

    console.log(`\n📉 GRAND TOTAL PENDING: ${totalPending} Leads needed to finish quota.`);
    console.log(`📦 AVAILABLE UNASSIGNED LEADS: ${unassignedLeadsCount}`);

    if (unassignedLeadsCount > 0) {
        console.log(`\n✅ TURBO SCRIPT CAN HELP! It can verify/assign these ${unassignedLeadsCount} leads faster.`);
    } else {
        console.log(`\n❌ TURBO SCRIPT USELESS RIGHT NOW. No unassigned leads available to distribute.`);
        console.log(`   (You need more LEADS supply from Facebook, not faster distribution).`);
    }
}

async function getUnassignedCount() {
    // Count leads valid today but unassigned or status='New'
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase.from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today + 'T00:00:00')
        .or('assigned_to.is.null,status.eq.New');
    return count || 0;
}

checkPendingQuota();
