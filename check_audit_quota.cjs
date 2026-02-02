const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkComprehensiveExpiry() {
    console.log("🔍 CHECKING ALL PAID USERS & PLAN EXPIRY STATUS...\n");

    // 1. Get all users who have 'active' payment status OR have a plan set (history of payment)
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, plan_name, is_active, payment_status, total_leads_received, total_leads_promised')
        .or('payment_status.eq.active,plan_name.neq.none');

    if (error) return console.log(error.message);

    let expiredAndActive = [];  // BAD: Quota Finished but System still Active
    let expiredAndStopped = []; // GOOD: Quota Finished and System Stopped
    let runningActive = [];     // NORMAL: Has Quota and Active
    let pausedWithQuota = [];   // PAUSED: Has Quota but Stopped (Manual or Failed)

    users.forEach(u => {
        const received = u.total_leads_received || 0;
        const promised = u.total_leads_promised || 0;

        // Skip users with 0 promised (unless they have received leads, then it's an anomaly)
        if (promised === 0 && received === 0) return;

        const isQuotaFinished = received >= promised;

        if (isQuotaFinished) {
            if (u.is_active) {
                expiredAndActive.push(u); // ⚠️ DANGER
            } else {
                expiredAndStopped.push(u); // ✅ CORRECT
            }
        } else {
            // Quota Remaining
            if (u.is_active) {
                runningActive.push(u); // ✅ RUNNING
            } else {
                pausedWithQuota.push(u); // ⏸️ PAUSED
            }
        }
    });

    console.log(`📊 TOTAL PAID USERS TRACKED: ${users.length}`);
    console.log(`---------------------------------------------------------`);
    console.log(`⚠️  EXPIRED BUT ACTIVE (Bug?):      ${expiredAndActive.length}`);
    console.log(`🛑 EXPIRED & STOPPED (Done):       ${expiredAndStopped.length}`);
    console.log(`---------------------------------------------------------`);
    console.log(`✅ ACTIVE RUNNING (On-going):      ${runningActive.length}`);
    console.log(`⏸️  PAUSED/STOPPED (Quota Left):    ${pausedWithQuota.length}`);
    console.log(`---------------------------------------------------------\n`);

    if (expiredAndActive.length > 0) {
        console.log(`⚠️ DETAILED LIST: EXPIRED BUT ACTIVE (Need to Stop):`);
        expiredAndActive.forEach(u => {
            console.log(`  🔴 ${u.name.padEnd(20)} | Leads: ${u.total_leads_received}/${u.total_leads_promised} | Plan: ${u.plan_name}`);
        });
    } else {
        console.log("✅ Great! No users are 'Expired but Active'.");
    }

    if (expiredAndStopped.length > 0) {
        console.log(`\n🛑 DETAILED LIST: EXPIRED & STOPPED (Completed):`);
        expiredAndStopped.forEach(u => {
            console.log(`  ✅ ${u.name.padEnd(20)} | Leads: ${u.total_leads_received}/${u.total_leads_promised}`);
        });
    } else {
        console.log("\nℹ️ No users have fully exhausted their quota yet (Everyone has leads remaining).");
    }

    if (pausedWithQuota.length > 0) {
        console.log(`\n⏸️ DETAILED LIST: PAUSED (Quota Remaining):`);
        pausedWithQuota.slice(0, 10).forEach(u => {
            console.log(`  🟠 ${u.name.padEnd(20)} | Leads: ${u.total_leads_received}/${u.total_leads_promised} | Status: ${u.payment_status}`);
        });
        if (pausedWithQuota.length > 10) console.log(`  ...and ${pausedWithQuota.length - 10} more`);
    }
}

checkComprehensiveExpiry();
