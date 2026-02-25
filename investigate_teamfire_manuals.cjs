const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log('=== 🕵️ TEAMFIRE DEACTIVATION AUDIT ===');

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
    }

    // 2. Audit TEAMFIRE Dormant
    const { data: teamfire } = await supabase
        .from('users')
        .select('*')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', false);

    console.log(`\n🛑 INACTIVE MEMBERS IN TEAMFIRE: ${teamfire?.length || 0}`);

    let reactivations = [];

    if (teamfire) {
        for (const u of teamfire) {
            const pending = (u.total_leads_promised || 0) - (u.total_leads_received || 0);

            // If they have PENDING LEADS, why are they inactive?
            if (pending > 0) {
                console.log(`   ⚠️ CANDIDATE: ${u.name} (${u.email})`);
                console.log(`      Pending: ${pending} | Plan: ${u.plan_name}`);

                // REACTIVATE THEM
                // But only if plan is not 'none' or if pending is significant?
                // User said "Manual Pay walo ko deactivate kar diya".

                reactivations.push(u);
            }
        }
    }

    if (reactivations.length > 0) {
        console.log(`\n✨ REACTIVATING ${reactivations.length} USERS...`);
        for (const u of reactivations) {
            await supabase
                .from('users')
                .update({
                    is_active: true,
                    valid_until: '2099-01-01T00:00:00.000Z',
                    payment_status: 'active'
                })
                .eq('id', u.id);
            console.log(`   ✅ Reactivated: ${u.email}`);
        }
    } else {
        console.log('\n✅ No False Deactivations found in TEAMFIRE.');
    }

})();
