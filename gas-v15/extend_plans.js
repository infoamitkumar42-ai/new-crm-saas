import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function extendPlans() {
    console.log('\n🔄 --- EXTENDING PLANS FOR 6 USERS ---\n');

    const usersToExtend = [
        'jk419473@gmail.com',           // Jashandeep kaur (turbo_boost)
        'rrai26597@gmail.com',          // Rahul Rai (weekly_boost)
        'palakgharu2025@gmail.com',     // Palak (weekly_boost)
        'navpreetkaur95271@gmail.com',  // Navpreet kaur (weekly_boost)
        'brark5763@gmail.com',          // Kiran Brar (weekly_boost)
        'sy390588@gmail.com'            // Sneha (weekly_boost)
    ];

    // New expiry date: Jan 23, 2026 (7 days from Jan 16)
    const newValidUntil = '2026-01-23T23:59:59+05:30';

    const { data: updated, error } = await supabase
        .from('users')
        .update({
            valid_until: newValidUntil,
            updated_at: new Date().toISOString()
        })
        .in('email', usersToExtend)
        .select('name, email, plan_name, valid_until');

    if (error) {
        console.error('❌ Error extending plans:', error);
        return;
    }

    console.log(`✅ Successfully extended plans for ${updated.length} users\n`);

    console.table(updated.map(u => ({
        Name: u.name,
        Email: u.email,
        Plan: u.plan_name,
        'New Expiry': new Date(u.valid_until).toLocaleDateString('en-IN'),
        'Days Added': 7
    })));

    // Verify
    const { data: verified } = await supabase
        .from('users')
        .select('name, email, valid_until')
        .in('email', usersToExtend);

    const now = new Date();
    console.log('\n✅ VERIFICATION:\n');
    verified.forEach(u => {
        const validUntil = new Date(u.valid_until);
        const daysRemaining = Math.ceil((validUntil - now) / (1000 * 60 * 60 * 24));
        const status = daysRemaining > 0 ? '✅ Active' : '❌ Expired';
        console.log(`   ${u.name}: ${status} (${daysRemaining} days remaining)`);
    });
}

extendPlans();
