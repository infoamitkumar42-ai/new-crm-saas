import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function extendExpiredPlans() {
    console.log('\n⏳ --- CHECKING & EXTENDING EXPIRED PLANS ---');

    const now = new Date().toISOString();

    // 1. Get Expired Users
    const { data: expiredUsers, error } = await supabase
        .from('users')
        .select('id, name, valid_until, email')
        .lt('valid_until', now); // Less than NOW

    if (error) {
        console.error("Error fetching users:", error.message);
        return;
    }

    if (!expiredUsers || expiredUsers.length === 0) {
        console.log("✅ No users have expired plans right now.");
        return;
    }

    console.log(`Found ${expiredUsers.length} users with expired plans.`);

    // 2. Calculate New Expiry (Now + 6 Days)
    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + 6);
    const newExpiryISO = newExpiryDate.toISOString();

    console.log(`Extending logic: Set valid_until to ${newExpiryISO} (Now + 6 Days)`);

    const updates = [];

    // 3. Update Each
    for (const user of expiredUsers) {
        process.stdout.write(`Extending ${user.name}... `);

        const { error: updateError } = await supabase
            .from('users')
            .update({ valid_until: newExpiryISO })
            .eq('id', user.id);

        if (updateError) {
            console.log(`❌ Failed: ${updateError.message}`);
        } else {
            console.log(`✅ Done.`);
            updates.push(user.name);
        }
    }

    console.log(`\n🎉 Successfully Extended ${updates.length} Users by 6 Days.`);
    console.log("List of Extended Users:", updates.join(", "));
}

extendExpiredPlans();
