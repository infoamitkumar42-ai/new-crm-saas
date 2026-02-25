const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log('=== 🕵️ INVESTIGATION: PRINCY & MANUAL DEACTIVATIONS ===');

    // 1. Audit Princy
    const { data: princy } = await supabase
        .from('users')
        .select('*')
        .ilike('name', '%princy%')
        .limit(1)
        .single();

    if (princy) {
        console.log(`\n👤 PRINCY STATUS (${princy.email})`);
        console.log(`   Plan: ${princy.plan_name}`);
        console.log(`   Promised: ${princy.total_leads_promised}`);
        console.log(`   Received: ${princy.total_leads_received}`);
        console.log(`   Pending: ${princy.total_leads_promised - princy.total_leads_received}`);
        console.log(`   Is Active: ${princy.is_active}`);

        // Check Payments for Princy
        const { data: pPay } = await supabase.from('payments').select('*').eq('user_id', princy.id);
        console.log(`   Payments Found: ${pPay?.length || 0}`);
        pPay?.forEach(p => console.log(`     - ₹${p.amount} on ${new Date(p.created_at).toLocaleDateString()}`));
    } else {
        console.log('❌ Princy not found!');
    }

    // 2. Audit "False Negative" Deactivations
    // Users who are: Inactive OR Plan='none' 
    // BUT have Promsied > Received? 
    // My previous script should have caught them. 
    // Let's check specifically for users with NO payments who might have been missed if I filtered by 'active' payments somewhere?
    // No, sync_and_set_2099 checked ALL users with plan != 'none'.

    // Let's check users INACTIVE but PROMISED > RECEIVED
    console.log('\n=== 🛑 INACTIVE USERS WITH PENDING QUOTA (Manual Checks) ===');

    const { data: dormant } = await supabase
        .from('users')
        .select('name, email, total_leads_promised, total_leads_received, plan_name, is_active')
        .eq('is_active', false)
        .gt('total_leads_promised', 0); // Has some quota set at least

    if (dormant) {
        let count = 0;
        for (const u of dormant) {
            const pending = (u.total_leads_promised || 0) - (u.total_leads_received || 0);
            if (pending > 0) {
                // This user SHOULD be active!
                console.log(`⚠️ FOUND DORMANT: ${u.email}`);
                console.log(`   Pending: ${pending} (${u.total_leads_received}/${u.total_leads_promised})`);
                console.log(`   Plan: ${u.plan_name}`);

                // Check payments
                const { data: pays } = await supabase.from('payments').select('id').eq('user_id', u.id);
                console.log(`   Payments: ${pays?.length || 0}`);

                if (pays?.length === 0) {
                    console.log(`   🚨 MANUAL PAYER DEACTIVATED! Need Reactivation.`);
                }
                count++;
            }
        }
        if (count === 0) console.log('✅ No inactive users found with pending quota.');
    }

})();
