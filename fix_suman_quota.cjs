const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_EMAIL = 'sumansumankaur09@gmail.com';
const FEB_START = '2026-02-01T00:00:00.000Z';

(async () => {
    console.log(`=== 🛠️ FIXING QUOTA FOR ${TARGET_EMAIL} (FEB ONLY) ===`);

    // 1. Get User
    const { data: user } = await supabase.from('users').select('id, name').eq('email', TARGET_EMAIL).single();
    if (!user) { console.error('User not found'); return; }

    // 2. Calculate Feb Payments (Paid Quota)
    const { data: payments } = await supabase
        .from('payments')
        .select('amount, created_at')
        .eq('user_id', user.id)
        .eq('status', 'captured')
        .gte('created_at', FEB_START);

    let paidQuota = 0;
    console.log('\n--- Feb Payments ---');
    if (payments) {
        payments.forEach(p => {
            const amt = Math.round(p.amount);
            let limit = 0;
            // Strict Price Logic
            if (amt >= 990 && amt <= 1000) limit = 50;
            else if (amt >= 1990 && amt <= 2000) limit = 105;
            else if (amt >= 2990 && amt <= 3000) limit = 160;
            else if (amt >= 2490 && amt <= 2500) limit = 98;

            console.log(`   ${new Date(p.created_at).toLocaleDateString()}: ₹${amt} -> +${limit} Leads`);
            paidQuota += limit;
        });
    }
    console.log(`   TOTAL PAID (FEB): ${paidQuota}`);

    // 3. Calculate Feb Usage (Real Leads)
    // We need to count leads assigned in FEB.
    // Note: 'leads' table has 'assigned_at' or 'created_at'? Usually created_at for assignment time if assigned immediately.
    // Let's use created_at >= Feb 1st

    // Check table structure via a quick count first? No, just run query.
    // We assume 'created_at' represents when the user got the lead (since they are assigned on creation usually).

    const { count: usedFeb, error } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id)
        .gte('created_at', FEB_START);

    if (error) { console.error('Error counting leads:', error); return; }

    console.log(`   TOTAL USED (FEB): ${usedFeb}`);

    const pending = paidQuota - usedFeb;
    console.log(`   PENDING: ${pending}`);

    // 4. Apply Update
    if (paidQuota > 0) {
        console.log(`\n✨ UPDATING USER...`);
        console.log(`   total_leads_promised = ${paidQuota}`);
        console.log(`   total_leads_received = ${usedFeb}`);

        await supabase
            .from('users')
            .update({
                total_leads_promised: paidQuota,
                total_leads_received: usedFeb,
                is_active: true,
                valid_until: '2099-01-01T00:00:00.000Z',
                payment_status: 'active'
            })
            .eq('id', user.id);

        console.log('✅ Update Complete.');
    } else {
        console.log('⚠️ No payments found in Feb. No update applied.');
    }

})();
