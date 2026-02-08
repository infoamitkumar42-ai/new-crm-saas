
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function fixUsers() {
    console.log("🚀 Starting Fix for Paying Users...");

    // 1. Get All Payments
    const { data: payments } = await supabase.from('payments').select('user_id, amount').eq('status', 'captured');

    // 2. Get All Team Users
    const { data: users } = await supabase
        .from('users')
        .select('id, email, plan_name, is_active')
        .eq('team_code', 'GJ01TEAMFIRE');

    const paymentMap = {};
    payments.forEach(p => {
        if (!paymentMap[p.user_id]) paymentMap[p.user_id] = 0;
        paymentMap[p.user_id] = Math.max(paymentMap[p.user_id], p.amount); // Keep max payment to determine tier
    });

    let fixedCount = 0;

    for (const u of users) {
        const amount = paymentMap[u.id];

        // Logic: If Paid > 0 AND (No Plan OR Inactive) -> Activate
        if (amount > 0 && (u.plan_name === 'none' || !u.plan_name || !u.is_active)) {
            let newPlan = 'starter';
            let newLimit = 55;

            if (amount >= 2999) { newPlan = 'manager'; newLimit = 176; }
            else if (amount >= 2499) { newPlan = 'turbo_boost'; newLimit = 108; }
            else if (amount >= 1999) { newPlan = 'weekly_boost'; newLimit = 92; }

            console.log(`🔧 Fixing User: ${u.email} (Paid ${amount}) -> ${newPlan}`);

            await supabase.from('users').update({
                plan_name: newPlan,
                daily_limit: newLimit,
                is_active: true,
                is_online: true,
                valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            }).eq('id', u.id);

            fixedCount++;
        }
    }

    // SPECIAL FIX FOR CHIRAG LOGIN
    console.log("🔧 Force Fixing Chirag (cmdarji1997)...");
    await supabase.from('users').update({
        plan_name: 'turbo_boost',
        daily_limit: 14,
        is_active: true,
        is_online: true
    }).eq('email', 'cmdarji1997@gmail.com');

    console.log(`✅ Fixed ${fixedCount} users + Chirag.`);
}

fixUsers();
