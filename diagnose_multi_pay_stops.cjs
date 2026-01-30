const { createClient } = require('@supabase/supabase-js');

// HARDCODED CREDENTIALS (TO ENSURE IT WORKS)
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

async function diagnose() {
    console.log('🔍 Diagnosing Inactive Users with Multiple Payments...');

    // 1. Get All Inactive Users
    const { data: users } = await supabase.from('users').select('*').eq('is_active', false);

    for (const u of users) {
        if (!u.plan_name) continue;

        // 2. Count Payments (All Time, Captured)
        const { data: payments } = await supabase.from('payments').select('id, status, amount').eq('user_id', u.id);

        const captured = payments ? payments.filter(p => p.status === 'captured').length : 0;

        // 3. Check Multi-Payment Users
        if (captured > 1) {
            console.log(`\n⚠️ Suspicious Stop: ${u.name} (${u.email})`);
            console.log(`   Plan: ${u.plan_name}`);
            console.log(`   Payments: ${captured} captured`);

            // Calc Quota
            const limit = PLAN_LIMITS[u.plan_name.toLowerCase()] || 0;
            const totalQuota = limit * captured;

            // Calc Usage
            const { count: leads } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', u.id);

            console.log(`   Usage: ${leads} / ${totalQuota}`);

            if (leads < totalQuota) {
                console.log('   ❌ ERROR: Stopped but Quota Remaining!');
                console.log('   FIXING NOW...');

                await supabase.from('users').update({
                    is_active: true,
                    daily_limit: 5, // Reset to base
                    payment_status: 'active',
                    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                }).eq('id', u.id);
                console.log('   ✅ Reactivated.');
            } else {
                console.log('   ✅ Correctly Stopped (Quota Full)');
            }
        }
    }
}

diagnose();
