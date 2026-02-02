const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

// Official Plan Limits (from image)
const PLAN_LIMITS = {
    'starter': { total: 50, replacement: 5, promised: 55 },
    'supervisor': { total: 105, replacement: 10, promised: 115 },
    'manager': { total: 160, replacement: 16, promised: 176 },
    'weekly_boost': { total: 84, replacement: 8, promised: 92 },
    'turbo_boost': { total: 98, replacement: 10, promised: 108 }
};

async function generateFullReport() {
    console.log("📊 GENERATING COMPREHENSIVE USER REPORT...\n");

    // 1. Fetch Users
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, plan_name, is_active, total_leads_received, total_leads_promised')
        .neq('plan_name', 'none')
        .order('name', { ascending: true });

    if (error) return console.log(error.message);

    // 2. Fetch Payments
    const { data: payments } = await supabase
        .from('payments')
        .select('user_id, amount, created_at')
        .eq('status', 'captured')
        .order('created_at', { ascending: true });

    // Map payments per user
    const paymentMap = new Map();
    (payments || []).forEach(p => {
        if (!paymentMap.has(p.user_id)) paymentMap.set(p.user_id, []);
        paymentMap.get(p.user_id).push(p);
    });

    // 3. Categorize
    let quotaDelivered = [];   // Total leads delivered
    let planStopped = [];      // is_active = false
    let renewedUsers = [];     // 2+ payments

    users.forEach(u => {
        const received = u.total_leads_received || 0;
        const promised = u.total_leads_promised || 0;
        const userPayments = paymentMap.get(u.id) || [];
        const payCount = userPayments.length;

        // Check if quota delivered
        if (promised > 0 && received >= promised) {
            quotaDelivered.push({ ...u, payCount });
        }

        // Check if stopped
        if (!u.is_active) {
            planStopped.push({ ...u, payCount });
        }

        // Check renewals (2+ payments)
        if (payCount >= 2) {
            renewedUsers.push({ ...u, payCount });
        }
    });

    // 4. Print Reports
    console.log(`==========================================================`);
    console.log(`📋 REPORT 1: QUOTA FULLY DELIVERED (${quotaDelivered.length} Users)`);
    console.log(`==========================================================`);
    if (quotaDelivered.length > 0) {
        quotaDelivered.forEach(u => {
            console.log(`  ✅ ${u.name.padEnd(22)} | ${u.plan_name.padEnd(12)} | Leads: ${u.total_leads_received}/${u.total_leads_promised}`);
        });
    } else {
        console.log("  ℹ️ No users have reached full quota yet.");
    }

    console.log(`\n==========================================================`);
    console.log(`📋 REPORT 2: PLAN STOPPED/PAUSED (${planStopped.length} Users)`);
    console.log(`==========================================================`);
    if (planStopped.length > 0) {
        planStopped.forEach(u => {
            const remaining = (u.total_leads_promised || 0) - (u.total_leads_received || 0);
            console.log(`  🛑 ${u.name.padEnd(22)} | ${u.plan_name.padEnd(12)} | Leads: ${u.total_leads_received}/${u.total_leads_promised} | Pending: ${remaining}`);
        });
    } else {
        console.log("  ℹ️ No users are stopped.");
    }

    console.log(`\n==========================================================`);
    console.log(`📋 REPORT 3: RENEWED USERS - 2+ PAYMENTS (${renewedUsers.length} Users)`);
    console.log(`==========================================================`);
    if (renewedUsers.length > 0) {
        renewedUsers.forEach(u => {
            console.log(`  🔄 ${u.name.padEnd(22)} | ${u.plan_name.padEnd(12)} | Payments: ${u.payCount}x | Leads: ${u.total_leads_received}/${u.total_leads_promised}`);
        });
    } else {
        console.log("  ℹ️ No users have renewed yet.");
    }

    console.log(`\n==========================================================`);
    console.log(`📊 SUMMARY`);
    console.log(`==========================================================`);
    console.log(`Total Paid Users:          ${users.length}`);
    console.log(`Quota Delivered:           ${quotaDelivered.length}`);
    console.log(`Plan Stopped/Paused:       ${planStopped.length}`);
    console.log(`Renewed (2+ Payments):     ${renewedUsers.length}`);
}

generateFullReport();
