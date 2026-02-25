const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log('=== INVESTIGATING EXPIRED RENEWALS ===');
    const logs = [];
    const users = ['dbrar8826@gmail.com', 'sipreet73@gmail.com'];

    for (const email of users) {
        console.log(`\n--- USER: ${email} ---`);
        const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
        if (!user) {
            console.log('User not found.');
            continue;
        }

        console.log(`ID: ${user.id}`);
        console.log(`Plan: ${user.plan_name} | Active: ${user.is_active} | Online: ${user.is_online}`);
        console.log(`Leads: ${user.total_leads_received} / ${user.total_leads_promised}`);
        console.log(`Valid Until: ${user.valid_until} (Expired: ${new Date(user.valid_until) < new Date()})`);

        // Fetch Payments
        const { data: payments } = await supabase
            .from('payments')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5);

        console.log('Recent Payments:');
        if (payments && payments.length > 0) {
            payments.forEach(p => {
                console.log(`- ${new Date(p.created_at).toLocaleString()}: ₹${p.amount} (${p.status})`);
            });

            // Logic Check
            const lastPayment = payments[0];
            const paymentDate = new Date(lastPayment.created_at);
            const now = new Date();
            const validUntil = new Date(user.valid_until);

            // Did he pay recently?
            const daysSincePayment = Math.floor((now - paymentDate) / (1000 * 60 * 60 * 24));

            // Expected Validity (Assuming 10 days for Starter/999)
            // Or 7 days for Weekly Boost/1999

            console.log(`Days Since Last Payment: ${daysSincePayment}`);

            // Diagnosis
            if (daysSincePayment < 10 && now > validUntil) {
                console.log('⚠️ ALERT: Valid Payment but EXPIRED! Validity logic failure or reset?');
            }

            // Quota Diagnosis
            // If recently paid (e.g. Starter 999), expected +55 leads.
            // If Total Promised is low, it means quota wasn't added.
        } else {
            console.log('No payments found.');
        }
    }
})();
