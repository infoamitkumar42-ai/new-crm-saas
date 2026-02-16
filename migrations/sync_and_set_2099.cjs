const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log('=== 🚀 MIGRATION: SYNC QUOTA & SET INFINITE VALIDITY (2099) ===');

    // 1. Fetch all users with a plan
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, total_leads_promised, total_leads_received, valid_until, is_active')
        .neq('plan_name', 'none');

    if (error) {
        console.error('Fetch Error:', error);
        return;
    }

    console.log(`Found ${users.length} users to audit...`);

    let reactivated = 0;
    let expired = 0;
    let extended = 0;

    for (const user of users) {
        // 2. Count REAL leads from 'leads' table
        const { count: realLeadsCount, error: countError } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', user.id);

        if (countError) {
            console.error(`Error counting leads for ${user.email}:`, countError.message);
            continue;
        }

        const promised = user.total_leads_promised || 0;
        const currentReceived = user.total_leads_received || 0;

        // Sync needed?
        let updateData = {};
        if (realLeadsCount !== currentReceived) {
            // console.log(`   Syncing count for ${user.name}: DB=${currentReceived} -> REAL=${realLeadsCount}`);
            updateData.total_leads_received = realLeadsCount;
        }

        // Logic Check: Pending Leads?
        if (realLeadsCount < promised) {
            // ✅ HAS PENDING LEADS
            updateData.valid_until = '2099-01-01T00:00:00.000Z'; // Infinite

            if (user.is_active === false) {
                console.log(`✅ REACTIVATING: ${user.email} (Pending: ${promised - realLeadsCount})`);
                updateData.is_active = true;
                updateData.is_online = true; // Set online too
                updateData.payment_status = 'active'; // Fix payment status
                reactivated++;
            } else {
                updateData.is_active = true; // Ensure true
                if (user.valid_until && !user.valid_until.startsWith('2099')) {
                    // console.log(`   Extending: ${user.email} -> 2099`);
                    extended++;
                }
            }

        } else {
            // ❌ QUOTA EXHAUSTED
            if (user.is_active === true) {
                console.log(`🛑 EXPIRING: ${user.email} (Used: ${realLeadsCount}/${promised})`);
                updateData.is_active = false;
                updateData.is_online = false;
                updateData.payment_status = 'inactive';
                updateData.daily_limit = 0;
                expired++;
            }
            // Even if expired, set valid_until to 2099 to avoid future date confusion? 
            // Better to leave it or set it to 2099 so they don't get blocked by date checks if we mistakenly re-enable.
            // But for now, let's set it to 2099 to keep schema consistent.
            updateData.valid_until = '2099-01-01T00:00:00.000Z';
        }

        // 3. Apply Update
        if (Object.keys(updateData).length > 0) {
            const { error: updateError } = await supabase
                .from('users')
                .update(updateData)
                .eq('id', user.id);

            if (updateError) console.error(`Failed to update ${user.email}:`, updateError.message);
        }
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Users Reactivated (Had Pending Leads): ${reactivated}`);
    console.log(`Users Expired (Quota Full): ${expired}`);
    console.log(`Users Extended to 2099: ${extended + reactivated}`); // Roughly
    console.log('Done.');
})();
