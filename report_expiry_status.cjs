const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
// Using the proven working Service Role Key
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkExpiryStatus() {
    console.log("📊 CHECKING EXPIRY & STOPPAGE STATUS...\n");

    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, plan_name, total_leads_received, total_leads_promised, is_active, payment_status')
        .neq('plan_name', 'none')
        .neq('plan_name', null);

    if (error) {
        console.log(`❌ Error: ${error.message}`);
        return;
    }

    let overdueActive = []; // Quota done but still active (LEAK)
    let expiredStopped = []; // Quota done and stopped (CORRECT)
    let nearExpiry = []; // Less than 10 leads remaining

    users.forEach(u => {
        const received = u.total_leads_received || 0;
        const promised = u.total_leads_promised || 0;

        // Ignore users with 0/0 (maybe manual without quota) or unlimited logic if any
        if (promised === 0) return;

        if (received >= promised) {
            // Quota Completed
            if (u.is_active) {
                // ISSUE: Should be stopped but is active
                overdueActive.push(u);
            } else {
                // CORRECT: Stopped
                expiredStopped.push(u);
            }
        } else {
            // Quota Remaining
            const remaining = promised - received;
            if (remaining <= 10 && u.is_active) {
                nearExpiry.push({ ...u, remaining });
            }
        }
    });

    console.log(`🔎 REPORT SUMMARY:`);
    console.log(`------------------------------------------------`);
    
    // 1. OVERDUE (The Problem)
    console.log(`⚠️  SHOULD BE EXPIRED BUT ACTIVE (LEAK): ${overdueActive.length}`);
    if (overdueActive.length > 0) {
        overdueActive.forEach(u => {
            console.log(`   🔴 ${u.name.padEnd(20)} | ${u.total_leads_received}/${u.total_leads_promised} | Plan: ${u.plan_name}`);
        });
    } else {
        console.log(`   ✅ None! System is stopping users correctly.`);
    }

    // 2. EXPIRED (The Good)
    console.log(`\n✅ EXPIRED & STOPPED CORRECTLY: ${expiredStopped.length}`);
    if (expiredStopped.length > 0) {
        expiredStopped.slice(0, 10).forEach(u => {
            console.log(`   ⚪ ${u.name.padEnd(20)} | ${u.total_leads_received}/${u.total_leads_promised}`);
        });
        if (expiredStopped.length > 10) console.log(`      ...and ${expiredStopped.length - 10} more`);
    }

    // 3. NEAR EXPIRY (Alert)
    console.log(`\n⏳ NEAR EXPIRY (Active users < 10 leads left): ${nearExpiry.length}`);
    if (nearExpiry.length > 0) {
        nearExpiry.forEach(u => {
            console.log(`   🟠 ${u.name.padEnd(20)} | Remaining: ${u.remaining}`);
        });
    }
}

checkExpiryStatus();
