
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreUsers() {
    console.log("🔄 Checking & Restoring Skipped Users (Ruchi, Kirandeep)...\n");

    const targets = ['ruchitanwar2004@gmail.com', 'kirandeepkaur7744@gmail.com'];

    // 1. Fetch current status
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, daily_limit, is_active')
        .in('email', targets);

    if (error) { console.error("Err:", error); return; }

    for (const u of users) {
        console.log(`👤 ${u.name} (${u.email})`);
        console.log(`   Current Limit: ${u.daily_limit}`);
        console.log(`   Active Status: ${u.is_active}`);

        if (u.daily_limit === 0 || u.daily_limit === null) {
            console.log(`   ⚠️ Limit is 0. RESTORING to 5...`);

            const { error: updateErr } = await supabase
                .from('users')
                .update({ daily_limit: 5 })
                .eq('id', u.id);

            if (updateErr) console.error("   ❌ Update Failed:", updateErr);
            else console.log(`   ✅ Limit Updated to 5.`);
        } else {
            console.log(`   ✅ Limit is already active (${u.daily_limit}). No action needed.`);
        }
        console.log("-".repeat(40));
    }

    // 2. Scan for OTHER active users with Limit 0
    console.log(`\n🔍 Scanning for OTHER Active Users with Limit = 0...`);
    const { data: pausedUsers } = await supabase
        .from('users')
        .select('name, email, daily_limit')
        .eq('is_active', true)
        .eq('daily_limit', 0)
        .not('email', 'in', `(${targets.join(',')})`); // Exclude the ones we just checked

    if (pausedUsers && pausedUsers.length > 0) {
        console.log(`⚠️ FOUND ${pausedUsers.length} PAUSED ACTIVE USERS:`);
        pausedUsers.forEach(u => console.log(`   - ${u.name} (${u.email})`));
    } else {
        console.log(`✅ No other active users are paused (Limit 0).`);
    }
}

restoreUsers();
