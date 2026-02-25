const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

const TEAM = 'GJ01TEAMFIRE';
const WHITELIST = [
    'cmdarji1997@gmail.com',
    'kaushalrathod2113@gmail.com',
    'bhumitpatel.0764@gmail.com'
];

(async () => {
    console.log(`=== 🛑 DEACTIVATING MANUAL USERS: ${TEAM} ===`);

    // 1. Get all users in team
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, name, email, is_active')
        .eq('team_code', TEAM);

    if (userError) {
        console.error('Error fetching users:', userError);
        return;
    }

    console.log(`Checking ${users.length} members...`);

    let deactivationCount = 0;
    let skipCount = 0;

    for (const user of users) {
        // Skip if whitelisted
        if (WHITELIST.includes(user.email.toLowerCase())) {
            console.log(`✅ Skipping (WHITELISTED): ${user.email}`);
            skipCount++;
            continue;
        }

        // 2. Check for payments
        const { data: payments, error: payError } = await supabase
            .from('payments')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', 'captured')
            .limit(1);

        if (payError) {
            console.error(`Error checking payments for ${user.email}:`, payError);
            continue;
        }

        // 3. Deactivate if no payments found
        if (!payments || payments.length === 0) {
            console.log(`⚠️ DEACTIVATING (MANUAL/NO-PAY): ${user.email}`);
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    is_active: false,
                    daily_limit: 0
                })
                .eq('id', user.id);

            if (updateError) {
                console.error(`Failed to deactivate ${user.email}:`, updateError);
            } else {
                deactivationCount++;
            }
        } else {
            console.log(`🟢 Keeping (PAID): ${user.email}`);
            skipCount++;
        }
    }

    console.log(`\n--- SUMMARY ---`);
    console.log(`Total Deactivated: ${deactivationCount}`);
    console.log(`Total Skipped (Paid or Whitelisted): ${skipCount}`);
    console.log(`----------------\n`);
})();
