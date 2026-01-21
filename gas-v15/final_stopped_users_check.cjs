
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFinalStopped() {
    console.log("🛡️ Checking Final Stopped Users Count...\n");

    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, leads_today, daily_limit')
        .eq('is_active', true);

    if (error) { console.error("Err:", error); return; }

    // Logic: daily_limit > 0 AND leads_today >= daily_limit
    const stoppedUsers = users.filter(u => u.daily_limit > 0 && u.leads_today >= u.daily_limit);

    // Also Check those with limit 0 (Paused) ? The user asked for "Quota Stop", implying those who filled it.
    // Usually daily_limit 0 means manually paused or no plan. Let's list those separately if needed.
    // For "Quota Full", we look at u.daily_limit > 0.

    console.log(`✅ Total Users with Full Quota: ${stoppedUsers.length}`);

    // Sort by most over-limit
    stoppedUsers.sort((a, b) => (b.leads_today - b.daily_limit) - (a.leads_today - a.daily_limit));

    console.log(`\n📋 List of Stopped Users:`);
    stoppedUsers.forEach((u, index) => {
        const diff = u.leads_today - u.daily_limit;
        console.log(`   ${index + 1}. ${u.name} (Limit: ${u.daily_limit} | Has: ${u.leads_today}) ${diff > 0 ? '⚠️ +' + diff : '✅'}`);
    });
}

checkFinalStopped();
