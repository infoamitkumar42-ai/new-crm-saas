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

async function deepDiagnose() {
    console.log('🔍 DEEP SCAN: Users with Multiple Payments (Active & Inactive)...');

    // 1. Get ALL Users
    const { data: users } = await supabase.from('users').select('*').neq('plan_name', 'none').not('plan_name', 'is', null);

    console.log(`Scanning ${users.length} users with plans...`);

    let foundIssues = 0;

    for (const u of users) {

        // 2. Count Payments (Captured)
        const { data: payments } = await supabase.from('payments').select('id, status').eq('user_id', u.id).eq('status', 'captured');
        const payCount = payments ? payments.length : 0;

        // Only interested if they paid more than once
        if (payCount > 1) {

            // 3. Calc Total Quota
            const baseLimit = PLAN_LIMITS[u.plan_name.toLowerCase()] || 0;
            const totalQuota = baseLimit * payCount;

            // 4. Calc Usage
            const { count: leads } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', u.id);
            const usage = leads || 0;
            const remaining = totalQuota - usage;

            // 5. Check Status
            // Defined as "Stuck" if:
            // - Usage < Quota AND
            // - (IsInactive OR DailyLimit=0)

            const isStuck = remaining > 0 && (!u.is_active || u.daily_limit === 0);

            if (isStuck) {
                console.log(`\n⚠️ STUCK USER FOUND: ${u.name} (${u.email})`);
                console.log(`   Plan: ${u.plan_name} x ${payCount} Payments`);
                console.log(`   Quota: ${usage} / ${totalQuota} (Remaining: ${remaining})`);
                console.log(`   Status: Active=${u.is_active}, Limit=${u.daily_limit}`);

                // FIX
                console.log('   🛠️ FIXING...');

                await supabase.from('users').update({
                    is_active: true,
                    daily_limit: 5, // Default base
                    payment_status: 'active',
                    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                }).eq('id', u.id);

                console.log('   ✅ Fixed.');
                foundIssues++;
            }
        }
    }

    if (foundIssues === 0) console.log('\n✅ No other stuck users found.');
    else console.log(`\n✨ Fixed ${foundIssues} more users.`);
}

deepDiagnose();
