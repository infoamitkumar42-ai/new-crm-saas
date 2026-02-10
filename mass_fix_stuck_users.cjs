const { createClient } = require('@supabase/supabase-js');

// HARDCODED CREDENTIALS
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PLAN_LIMITS = {
    'starter': 55,
    'supervisor': 115,
    'manager': 176,
    'weekly_boost': 92,
    'turbo_boost': 108
};

async function massFix() {
    console.log('--- 🛠️ MASS FIX: STARTING RECTIFICATION ---\n');

    // 1. Fetch All Users with a Plan
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, plan_name, total_leads_promised, total_leads_received, is_plan_pending, is_active, payment_status, daily_limit')
        .neq('plan_name', 'none')
        .not('plan_name', 'is', null);

    if (error) {
        console.error('Error fetching users:', error);
        return;
    }

    console.log(`Processing ${users.length} users...\n`);

    let fixedCount = 0;

    for (const user of users) {
        // A. Get Captured Payments
        const { data: payments } = await supabase
            .from('payments')
            .select('created_at, status')
            .eq('user_id', user.id)
            .eq('status', 'captured');

        const payCount = payments ? payments.length : 0;
        if (payCount === 0) continue;

        const baseLimit = PLAN_LIMITS[user.plan_name.toLowerCase()] || 0;
        const expectedTotalQuota = baseLimit * payCount;
        const currentPromised = user.total_leads_promised || 0;
        const received = user.total_leads_received || 0;

        let needsUpdate = false;
        const updates = {};

        // LOGIC 1: Align Quota
        // If promised is set but incorrect (smaller than paid for)
        if (currentPromised > 0 && currentPromised < expectedTotalQuota) {
            updates.total_leads_promised = expectedTotalQuota;
            needsUpdate = true;
        }

        // LOGIC 2: Clear Pending Status
        // If pending is true and we have captured payments
        if (user.is_plan_pending) {
            const lastPay = payments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
            const lastPayDate = new Date(lastPay.created_at);
            const hoursSincePay = (Date.now() - lastPayDate.getTime()) / (1000 * 60 * 60);

            if (hoursSincePay > 2) { // 2 hours buffer
                updates.is_plan_pending = false;
                needsUpdate = true;
            }
        }

        // LOGIC 3: Reactivate if Quota Remains
        const activeQuota = updates.total_leads_promised || (currentPromised > 0 ? currentPromised : expectedTotalQuota);
        if (received < activeQuota) {
            if (!user.is_active || user.daily_limit === 0) {
                updates.is_active = true;
                // Restore limit
                let defaultLimit = 5;
                if (user.plan_name.includes('weekly')) defaultLimit = 8;
                if (user.plan_name.includes('manager')) defaultLimit = 8;
                if (user.plan_name.includes('supervisor')) defaultLimit = 7;
                if (user.plan_name.includes('turbo')) defaultLimit = 12;

                updates.daily_limit = defaultLimit;
                updates.payment_status = 'active';
                needsUpdate = true;
            }
        }

        if (needsUpdate) {
            console.log(`✅ Fixing: ${user.name} (${user.email})`);
            Object.keys(updates).forEach(k => console.log(`   - ${k}: ${updates[k]}`));

            const { error: upErr } = await supabase.from('users').update(updates).eq('id', user.id);
            if (upErr) console.error(`   ❌ Update Error: ${upErr.message}`);
            else fixedCount++;
        }
    }

    console.log(`\n--- FINAL REPORT ---`);
    console.log(`Total Users Rectified: ${fixedCount}`);
    console.log(`--- END ---`);
}

massFix();
