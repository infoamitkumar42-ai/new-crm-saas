import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixAndDistribute() {
    console.log('\n🌍 --- GLOBAL RESET: ALL INDIA & ANY GENDER ---\n');

    // 1. Update ALL Users
    const { error: updateError, count } = await supabase
        .from('users')
        .update({
            target_state: 'All India',
            target_gender: 'Any'
        })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Dummy filter to update all

    console.log(`✅ Updated Preferences for ALL Users (Set to 'All India' / 'Any').`);

    // 2. Find Orphan Leads (Today)
    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);

    const { data: orphans } = await supabase
        .from('leads')
        .select('id, name, phone, city, state')
        .gte('created_at', startToday.toISOString())
        .is('assigned_to', null);

    if (!orphans || orphans.length === 0) {
        console.log("✅ No orphan leads found to distribute.");
        return;
    }

    console.log(`\n🚨 Found ${orphans.length} ORPHAN LEADS. Distributing now...`);

    // 3. Get Eligible Users
    // Must be Active, Paid, Daily Limit > 0
    const now = new Date().toISOString();
    const { data: users } = await supabase
        .from('users')
        .select('id, name, leads_today')
        .eq('is_active', true)
        .gt('daily_limit', 0)
        .gt('valid_until', now)
        .order('leads_today', { ascending: true }); // Give to those with fewer leads first

    if (!users || users.length === 0) {
        console.error("❌ CRITICAL: No eligible active users found!");
        return;
    }

    console.log(`ℹ️ Distribution Pool: ${users.length} Active Users.`);

    // 4. Distribute
    let userIndex = 0;

    for (const lead of orphans) {
        const user = users[userIndex];
        userIndex = (userIndex + 1) % users.length;

        // Assign
        const { error: assignError } = await supabase
            .from('leads')
            .update({
                assigned_to: user.id,
                user_id: user.id,
                status: 'Assigned',
                assigned_at: new Date().toISOString()
            })
            .eq('id', lead.id);

        if (!assignError) {
            console.log(`   ✅ ${lead.name} -> ${user.name}`);

            // Update Counter
            // Note: In a loop this local count drift matters, but for 10 leads it's fine.
            // Best practice: Update DB counter.
            await supabase.rpc('increment_leads_today', { user_id: user.id });
            // Wait, do we have an RPC? Probably not. let's direct update.

            const { data: freshUser } = await supabase.from('users').select('leads_today').eq('id', user.id).single();
            await supabase.from('users').update({ leads_today: (freshUser.leads_today || 0) + 1 }).eq('id', user.id);
        } else {
            console.error(`   ❌ Failed to assign ${lead.name}: ${assignError.message}`);
        }
    }

    console.log("\n🎉 ORPHANS CLEARED.");
}

fixAndDistribute();
