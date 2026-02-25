const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log('=== INVESTIGATION: SAMANDEEP ===');
    const email = 'samandeepkaur1216@gmail.com';

    // 1. Fetch User
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (userError) {
        console.log('❌ User Error:', userError.message);
    } else {
        console.log('User Found:');
        console.log(`  Name: ${user.name}`);
        console.log(`  Plan: ${user.plan_name}`);
        console.log(`  Active: ${user.is_active}`);
        console.log(`  Valid Until: ${user.valid_until}`);
        console.log(`  Team: ${user.team_code}`);
        console.log(`  Daily Limit: ${user.daily_limit}`);
        console.log(`  Leads Today: ${user.leads_today}`);
        console.log(`  Total Promised: ${user.total_leads_promised}`);
        console.log(`  Total Received: ${user.total_leads_received}`);
    }

    // 2. Fetch Payments
    if (user) {
        const { data: payments } = await supabase
            .from('payments')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        console.log('\nPayments:');
        if (payments && payments.length > 0) {
            payments.forEach(p => {
                console.log(`  - ${p.amount} | ${p.status} | ${new Date(p.created_at).toLocaleString()}`);
            });
        } else {
            console.log('  No payments found.');
        }
    }
})();
