const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log('=== DEEP SYSTEM AUDIT: EXPIRED BUT PENDING QUOTA ===');

    // Fetch users with pending leads
    const { data: users, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .neq('plan_name', 'none')
        .gt('total_leads_promised', 0);

    if (fetchError) {
        console.error('Audit Fetch Error:', fetchError.message);
        return;
    }

    const now = new Date();
    const victims = [];

    for (const u of users) {
        const received = u.total_leads_received || 0;
        const promised = u.total_leads_promised || 0;

        if (received >= promised) continue;

        const pending = promised - received;
        // Skip insignificant pending leads (buffer of 5)
        if (pending <= 5) continue;

        const expiry = new Date(u.valid_until);
        const isExpired = expiry < now;
        const isExpiringSoon = expiry < new Date(now.getTime() + 24 * 60 * 60 * 1000);

        if (isExpired || isExpiringSoon) {
            // Verify Payment History
            const { data: payments } = await supabase
                .from('payments')
                .select('created_at, amount')
                .eq('user_id', u.id)
                .eq('status', 'captured')
                .order('created_at', { ascending: false })
                .limit(1);

            const lastPayment = payments?.[0];
            const lastPayDate = lastPayment ? new Date(lastPayment.created_at).toLocaleDateString() : 'Never';

            if (lastPayment) {
                victims.push({
                    name: u.name,
                    email: u.email,
                    plan: u.plan_name,
                    pending: pending,
                    expiry: expiry.toLocaleString(),
                    status: isExpired ? 'Expired' : 'Expiring Soon',
                    last_payment: `${lastPayment.amount} on ${lastPayDate}`,
                    team: u.team_code || 'No Team'
                });
            }
        }
    }

    fs.writeFileSync('c:\\Users\\HP\\Downloads\\new-crm-saas\\expired_victims.json', JSON.stringify(victims, null, 2));
    console.log(`Saved ${victims.length} victims to expired_victims.json`);
})();
