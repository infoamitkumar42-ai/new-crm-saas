const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log('=== 📊 MIGRATION REPORT: QUOTA STATUS ===');

    // Fetch all users with 2099 validity (Processed Users)
    // Or just all users with a plan
    const { data: users, error } = await supabase
        .from('users')
        .select('name, email, total_leads_promised, total_leads_received, is_active, valid_until')
        .neq('plan_name', 'none')
        .order('is_active', { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    let reactivated = [];
    let expired = [];
    let weird = [];

    for (const user of users) {
        const promised = user.total_leads_promised || 0;
        const received = user.total_leads_received || 0;
        const pending = promised - received;

        if (user.is_active) {
            // Active Users
            if (pending > 0) {
                reactivated.push({
                    name: user.name,
                    email: user.email,
                    usage: `${received}/${promised}`,
                    reason: `✅ Active (Pending: ${pending} Leads)`
                });
            } else {
                // Active but quota full? Should have been expired! 
                // Unless newly added logic allows it or infinite validity just set?
                // Wait, if I just ran the script, these should be expired.
                // Or maybe they have 0 promised?
                weird.push({
                    name: user.name,
                    email: user.email,
                    usage: `${received}/${promised}`,
                    reason: `⚠️ Active but Quota Full?`
                });
            }
        } else {
            // Inactive Users
            if (pending <= 0) {
                expired.push({
                    name: user.name,
                    email: user.email,
                    usage: `${received}/${promised}`,
                    reason: `🛑 Expired (Quota Exhausted)`
                });
            } else {
                // Inactive but has quota? Maybe manually stopped?
                weird.push({
                    name: user.name,
                    email: user.email,
                    usage: `${received}/${promised}`,
                    reason: `⚠️ Inactive but Has Quota (Manual Stop?)`
                });
            }
        }
    }

    console.log(`\n✅ RE-ACTIVATED / ACTIVE PROPERLY: ${reactivated.length}`);
    console.log('--- Examples ---');
    reactivated.slice(0, 5).forEach(u => console.log(`${u.email} -> ${u.usage} (${u.reason})`));

    console.log(`\n🛑 EXPIRED / STOPPED PROPERLY: ${expired.length}`);
    console.log('--- Examples ---');
    expired.slice(0, 5).forEach(u => console.log(`${u.email} -> ${u.usage} (${u.reason})`));

    console.log(`\n⚠️ ANOMALIES (Check specific cases): ${weird.length}`);
    weird.slice(0, 5).forEach(u => console.log(`${u.email} -> ${u.usage} (${u.reason})`));

})();
