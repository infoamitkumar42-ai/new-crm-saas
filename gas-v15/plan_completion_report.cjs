
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function getPlanCompletionReport() {
    console.log("📊 PLAN COMPLETION REPORT (Using total_leads_promised & total_leads_received)\n");
    console.log("=".repeat(80));

    // Get all active users with plan fields
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, plan_name, total_leads_promised, total_leads_received, daily_limit')
        .eq('is_active', true)
        .gt('daily_limit', 0)
        .order('total_leads_received', { ascending: false });

    if (error) { console.error("Err:", error); return; }

    const completedPlans = [];
    const nearComplete = [];
    const inProgress = [];

    for (const u of users) {
        const promised = u.total_leads_promised || 0;
        const received = u.total_leads_received || 0;

        if (promised === 0) continue;

        const percentage = Math.round((received / promised) * 100);
        const remaining = Math.max(0, promised - received);
        const extra = received > promised ? received - promised : 0;

        const userData = {
            name: u.name,
            plan: u.plan_name,
            promised: promised,
            received: received,
            remaining: remaining,
            extra: extra,
            percentage: percentage
        };

        if (received >= promised) {
            completedPlans.push(userData);
        } else if (percentage >= 80) {
            nearComplete.push(userData);
        } else {
            inProgress.push(userData);
        }
    }

    // Sort
    completedPlans.sort((a, b) => b.extra - a.extra);
    nearComplete.sort((a, b) => b.percentage - a.percentage);

    // COMPLETED PLANS (100%+)
    console.log(`\n✅ PLAN COMPLETE (Got ALL + Extra): ${completedPlans.length} Users`);
    console.log("-".repeat(80));
    console.log(`| Name                 | Plan      | Promised | Got    | EXTRA  |`);
    console.log("-".repeat(80));
    completedPlans.forEach(u => {
        console.log(`| ${u.name.padEnd(20)} | ${(u.plan || 'N/A').toString().padEnd(9)} | ${String(u.promised).padEnd(8)} | ${String(u.received).padEnd(6)} | +${u.extra} ✨`);
    });

    // NEAR COMPLETE (80-99%)
    console.log(`\n\n🟡 ALMOST COMPLETE (80-99%): ${nearComplete.length} Users`);
    console.log("-".repeat(80));
    console.log(`| Name                 | Plan      | Promised | Got    | Left   | %    |`);
    console.log("-".repeat(80));
    nearComplete.forEach(u => {
        console.log(`| ${u.name.padEnd(20)} | ${(u.plan || 'N/A').toString().padEnd(9)} | ${String(u.promised).padEnd(8)} | ${String(u.received).padEnd(6)} | ${String(u.remaining).padEnd(6)} | ${u.percentage}%`);
    });

    // IN PROGRESS
    console.log(`\n\n🔄 IN PROGRESS (<80%): ${inProgress.length} Users`);

    // SUMMARY
    console.log(`\n${"=".repeat(80)}`);
    console.log(`📈 SUMMARY:`);
    console.log(`   Plans Complete (100%+):  ${completedPlans.length}`);
    console.log(`   Almost Complete (80%+):  ${nearComplete.length}`);
    console.log(`   In Progress (<80%):      ${inProgress.length}`);
    console.log(`${"=".repeat(80)}`);
}

getPlanCompletionReport();
