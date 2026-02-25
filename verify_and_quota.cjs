const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verifyAndReport() {
    // ═══════════════════════════════════════
    // 1. VERIFY RPC UPDATE
    // ═══════════════════════════════════════
    console.log("1️⃣  VERIFYING RPC UPDATE...");
    const { data: rpcResult, error: rpcError } = await supabase
        .rpc('get_best_assignee_for_team', { p_team_code: 'TEAMFIRE' });

    if (rpcError) {
        console.error("❌ RPC ERROR:", rpcError.message);
    } else if (rpcResult && rpcResult.length > 0) {
        const top = rpcResult[0];
        console.log(`✅ RPC Working! Top candidate: ${top.user_name} (${top.plan_name})`);
        console.log(`   Leads Today: ${top.leads_today}, Limit: ${top.daily_limit}, Priority: ${top.debug_priority}`);
    } else {
        console.log("⚠️ RPC returned 0 candidates (all at capacity or offline).");
    }

    // ═══════════════════════════════════════
    // 2. CHECK QUEUE
    // ═══════════════════════════════════════
    console.log("\n2️⃣  CHECKING LEAD QUEUE...");
    const today = new Date().toISOString().split('T')[0];

    const { data: queuedLeads, count: queuedCount } = await supabase
        .from('leads')
        .select('id, status, source', { count: 'exact' })
        .in('status', ['Queued', 'New', 'Night_Backlog'])
        .is('assigned_to', null)
        .gte('created_at', today);

    console.log(`📦 Unassigned leads in queue: ${queuedCount || 0}`);
    if (queuedCount > 0) {
        const statusBreakdown = {};
        queuedLeads.forEach(l => { statusBreakdown[l.status] = (statusBreakdown[l.status] || 0) + 1; });
        console.table(statusBreakdown);
    }

    // ═══════════════════════════════════════
    // 3. TEAM-WISE QUOTA SHORTFALL
    // ═══════════════════════════════════════
    console.log("\n3️⃣  TEAM-WISE QUOTA SHORTFALL...");

    const { data: users } = await supabase
        .from('users')
        .select('name, team_code, daily_limit, daily_limit_override, leads_today, plan_name')
        .eq('payment_status', 'active')
        .eq('is_active', true);

    const teams = {};
    let grandTotalLimit = 0;
    let grandTotalAssigned = 0;
    let grandTotalPending = 0;

    users.forEach(u => {
        const team = u.team_code || 'NO_TEAM';
        const limit = u.daily_limit_override || u.daily_limit || 0;
        const assigned = u.leads_today || 0;
        const remaining = Math.max(0, limit - assigned);

        if (!teams[team]) {
            teams[team] = { activeMembers: 0, totalLimit: 0, assignedToday: 0, pending: 0 };
        }

        teams[team].activeMembers++;
        teams[team].totalLimit += limit;
        teams[team].assignedToday += assigned;
        teams[team].pending += remaining;

        grandTotalLimit += limit;
        grandTotalAssigned += assigned;
        grandTotalPending += remaining;
    });

    console.log("\n┌─────────────────┬─────────┬───────────┬──────────┬─────────┐");
    console.log("│ Team            │ Members │ DayLimit  │ Assigned │ PENDING │");
    console.log("├─────────────────┼─────────┼───────────┼──────────┼─────────┤");
    for (const [team, data] of Object.entries(teams).sort((a, b) => b[1].pending - a[1].pending)) {
        console.log(`│ ${team.padEnd(15)} │ ${String(data.activeMembers).padStart(7)} │ ${String(data.totalLimit).padStart(9)} │ ${String(data.assignedToday).padStart(8)} │ ${String(data.pending).padStart(7)} │`);
    }
    console.log("├─────────────────┼─────────┼───────────┼──────────┼─────────┤");
    console.log(`│ ${'GRAND TOTAL'.padEnd(15)} │ ${String(users.length).padStart(7)} │ ${String(grandTotalLimit).padStart(9)} │ ${String(grandTotalAssigned).padStart(8)} │ ${String(grandTotalPending).padStart(7)} │`);
    console.log("└─────────────────┴─────────┴───────────┴──────────┴─────────┘");

    console.log(`\n🚨 TOTAL LEADS NEEDED TO COMPLETE QUOTA: ${grandTotalPending}`);
}

verifyAndReport();
