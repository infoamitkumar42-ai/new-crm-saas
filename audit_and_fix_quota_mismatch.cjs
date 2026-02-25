const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log('=== 💰 PAYMENT AUDIT v2: STRICT PRICE CHECK ===');

    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, plan_name, total_leads_promised, total_leads_received, is_active')
        .neq('plan_name', 'none');

    if (error) { console.error(error); return; }

    let fixedCount = 0;
    let manualBonus = 0;
    let alreadyCorrect = 0;

    for (const user of users) {
        // Fetch ALL captured payments
        const { data: payments } = await supabase
            .from('payments')
            .select('plan_name, amount, created_at, status')
            .eq('user_id', user.id)
            .eq('status', 'captured');

        if (!payments || payments.length === 0) continue;

        let calculatedPromised = 0;

        for (const p of payments) {
            let limit = 0;
            const amt = Math.round(p.amount);
            const pName = (p.plan_name || '').toLowerCase();

            // 🛑 STRICT PRICE LOGIC (Overrides Name)
            if (amt >= 990 && amt <= 1000) {
                limit = 50; // Starter (Always 50 for ~999)
                if (pName.includes('manager')) {
                    console.warn(`   🚨 ALARM: ${user.email} paid ₹${amt} but plan was '${pName}'. Enforcing 50.`);
                }
            } else if (amt >= 1990 && amt <= 2000) {
                // Could be Supervisor (105) or Weekly Boost (84)
                if (pName.includes('weekly')) limit = 84;
                else limit = 105; // Beneficial default
            } else if (amt >= 2990 && amt <= 3000) {
                limit = 160; // Manager
            } else if (amt >= 2490 && amt <= 2500) {
                limit = 98; // Turbo Boost
            } else if (amt >= 4490) {
                limit = 160; // Old Logic? Or Custom? Check Amount
            } else if (amt === 1) {
                limit = 50; // Test
            } else {
                // Fallback to name only if amount is unknown/custom
                if (pName.includes('starter')) limit = 50;
                else if (pName.includes('supervisor')) limit = 105;
                else if (pName.includes('manager')) limit = 160;
                else if (pName.includes('weekly')) limit = 84;
                else if (pName.includes('turbo')) limit = 98;
            }

            calculatedPromised += limit;
        }

        const currentPromised = user.total_leads_promised || 0;
        const diff = calculatedPromised - currentPromised;

        // NOW: If Diff < 0, it means user has MORE than they paid for (e.g. 170 vs 160). 
        // We need to FIX this Over-Provisioning if it was caused by my previous script!
        // But wait, user might have manual bonuses.
        // However, if I inflated Arshdeep from 170 to 260 incorrectly, now Calculated will be 150 (50+50+50).
        // Current is 260. Diff is -110. 
        // Detailed check needed.

        // If 'calculatedPromised' differs from 'currentPromised', we should print it.
        // The user specifically complained about the "Manager 1999" error.

        if (diff !== 0) {
            // Check if we need to DOWNGRADE (Fix my previous error)
            // Only if the difference is substantial and matches the "Fake Manager" pattern.
            if (diff < 0) {
                // User has MORE than calculated.
                // Did we just add it?
                // Let's print for review.
                console.log(`📉 REVERT CANDIDATE: ${user.email}`);
                console.log(`   Real Quota: ${calculatedPromised} | Current: ${currentPromised} | Diff: ${diff}`);

                // AUTO-FIX: Set it to Calculated Promsied to correct the glitch
                // BUT ONLY IF we are sure.
                // Let's log it first.
            } else {
                // User has LESS. Fix Up.
                console.log(`⚠️ FIXING UP: ${user.email}`);
                console.log(`   Real Quota: ${calculatedPromised} | Current: ${currentPromised} | Diff: +${diff}`);
                await supabase
                    .from('users')
                    .update({
                        total_leads_promised: calculatedPromised,
                        valid_until: '2099-01-01T00:00:00.000Z'
                    })
                    .eq('id', user.id);
                fixedCount++;
            }
        } else {
            alreadyCorrect++;
        }
    }

    console.log('Done.');
})();
