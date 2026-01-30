const { createClient } = require('@supabase/supabase-js');

// CONFIG
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const SYNC_INTERVAL_MINUTES = 15; // Sync every 15 minutes

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Sync leads_today for all active users
 */
async function syncCounters() {
    console.log(`\n[${new Date().toLocaleTimeString()}] 🔄 Starting Sync...`);

    // Today's range (IST)
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    try {
        const { data: users } = await supabase
            .from('users')
            .select('id, name, leads_today')
            .eq('is_active', true);

        if (!users) return;

        let fixedCount = 0;
        for (const user of users) {
            const { count } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .gte('created_at', todayStart)
                .lt('created_at', tomorrowStart);

            const realCount = count || 0;
            const storedCount = user.leads_today || 0;

            if (realCount !== storedCount) {
                await supabase.from('users').update({ leads_today: realCount }).eq('id', user.id);
                console.log(` ✅ Fixed ${user.name}: ${storedCount} -> ${realCount}`);
                fixedCount++;
            }
        }

        if (fixedCount === 0) console.log(' 👌 All counts matched.');
        else console.log(` ✨ Fixed ${fixedCount} users.`);

    } catch (err) {
        console.error('❌ Sync Error:', err.message);
    }
}

/**
 * Reset counters at Midnight IST
 */
async function checkMidnightReset() {
    const now = new Date();
    // Check if it's 12:00 AM - 12:05 AM
    if (now.getHours() === 0 && now.getMinutes() <= 5) {
        console.log(`\n[${new Date().toLocaleTimeString()}] 🌙 Midnight Reset Time!`);

        try {
            const { error } = await supabase
                .from('users')
                .update({ leads_today: 0 })
                .neq('id', '00000000-0000-0000-0000-000000000000');

            if (error) throw error;
            console.log(' ✅ All counters reset to 0.');

            // Wait 10 mins to avoid double reset
            await new Promise(r => setTimeout(r, 10 * 60 * 1000));
        } catch (err) {
            console.error('❌ Reset Error:', err.message);
        }
    }
}

// PLAN LIMITS (Per Payment)
const PLAN_LIMITS = {
    'starter': 55,
    'supervisor': 115,
    'manager': 176,
    'weekly_boost': 92,
    'turbo_boost': 108
};

/**
 * SMART QUOTA ENFORCEMENT
 * Stops user ONLY if Total Leads >= Quota
 * Reactivates user if Quota Remaining
 */
async function enforceSmartQuota() {
    console.log(`\n[${new Date().toLocaleTimeString()}] 🛡️ Checking Quotas...`);

    try {
        // Fetch users
        const { data: users, error } = await supabase
            .from('users')
            .select('id, name, email, plan_name, is_active, daily_limit, valid_until, total_leads_promised')
            .neq('plan_name', 'none')
            .not('plan_name', 'is', null);

        if (error) throw error;

        for (const user of users) {
            // A. Calculate Total Quota
            let totalQuota = user.total_leads_promised || 0;
            if (!totalQuota || totalQuota === 0) {
                const { data: payments } = await supabase.from('payments').select('id').eq('user_id', user.id).eq('status', 'captured');
                const payCount = payments ? payments.length : 1;
                const limit = PLAN_LIMITS[user.plan_name.toLowerCase()] || 0;
                totalQuota = limit * payCount;
            }

            // B. Calculate Used Leads
            const { count: used } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
            const leadsUsed = used || 0;
            const leadsRemaining = totalQuota - leadsUsed;

            // C. Enforcement
            if (leadsRemaining <= 0) {
                // STOP
                if (user.is_active || user.daily_limit > 0) {
                    console.log(` 🛑 STOPPING: ${user.name} (Quota Full: ${leadsUsed}/${totalQuota})`);
                    await supabase.from('users').update({ is_active: false, daily_limit: 0, payment_status: 'inactive' }).eq('id', user.id);
                }
            } else {
                // ACTIVATE / EXTEND
                const now = new Date();
                const validUntil = new Date(user.valid_until);
                const isDateExpired = validUntil < now;

                let updates = {};
                if (isDateExpired || !user.valid_until) {
                    const future = new Date();
                    future.setDate(future.getDate() + 30);
                    updates.valid_until = future.toISOString();
                    console.log(` 🔄 Extended Date: ${user.name}`);
                }

                if (user.is_active && user.daily_limit === 0) {
                    let defaultLimit = 5;
                    if (user.plan_name.includes('weekly') || user.plan_name.includes('manager')) defaultLimit = 8;
                    if (user.plan_name.includes('supervisor')) defaultLimit = 7;
                    if (user.plan_name.includes('turbo')) defaultLimit = 12;
                    updates.daily_limit = defaultLimit;
                    updates.payment_status = 'active';
                    console.log(` ✅ Reactivated Limit: ${user.name}`);
                }

                if (Object.keys(updates).length > 0) {
                    await supabase.from('users').update(updates).eq('id', user.id);
                }
            }
        }
    } catch (err) {
        console.error('❌ Quota Check Error:', err.message);
    }
}

// MAIN LOOP
console.log('🤖 Auto-Sync Bot Started...');
console.log(`   - Syncing counters every ${SYNC_INTERVAL_MINUTES} mins`);
console.log(`   - Enforcing Smart Quota every ${SYNC_INTERVAL_MINUTES} mins`);
console.log('   - Waiting for Midnight IST reset');

// Run immediately
syncCounters();
enforceSmartQuota();

// Loop
setInterval(async () => {
    await syncCounters();
    await enforceSmartQuota();
    await checkMidnightReset();
}, SYNC_INTERVAL_MINUTES * 60 * 1000);

// Check reset every minute
setInterval(checkMidnightReset, 60 * 1000);
