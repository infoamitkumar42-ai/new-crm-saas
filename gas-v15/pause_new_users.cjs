
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function pauseNewUsers() {
    console.log("🚫 Finding & Pausing NEW Users (Joined Today)...\n");

    // Today = Jan 18, 2026 (Midnight IST = 18:30 UTC prev day)
    const todayStart = '2026-01-17T18:30:00.000Z';

    // 1. Find users created today
    const { data: newUsers, error } = await supabase
        .from('users')
        .select('id, name, email, created_at, daily_limit')
        .gte('created_at', todayStart)
        .eq('is_active', true);

    if (error) { console.error("Err:", error); return; }

    console.log(`📋 Found ${newUsers.length} NEW Users (Created Today):`);

    if (newUsers.length === 0) {
        console.log("   No new users found today.");
        return;
    }

    newUsers.forEach(u => {
        console.log(`   👤 ${u.name} (${u.email}) | Current Limit: ${u.daily_limit}`);
    });

    // 2. Pause them by setting daily_limit to 0
    console.log(`\n⏸️ Pausing these users (Setting limit to 0)...`);

    for (const u of newUsers) {
        // Store original limit in a notes field or just set to 0
        await supabase
            .from('users')
            .update({
                daily_limit: 0,
                // We can store original in notes if needed
            })
            .eq('id', u.id);

        console.log(`   ✅ Paused: ${u.name}`);
    }

    console.log(`\n✅ Done! ${newUsers.length} new users paused.`);
    console.log(`   They will not receive leads today.`);
    console.log(`   Tomorrow, you can restore their limits.`);
}

pauseNewUsers();
