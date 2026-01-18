import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function diagnoseOrphanCause() {
    console.log('\n🔍 --- DIAGNOSING ORPHAN LEAD ROOT CAUSE ---\n');

    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 1. Check eligible users and their capacity
    const { data: allUsers } = await supabase
        .from('users')
        .select('id, name, target_gender, leads_today, daily_limit, valid_until, last_activity, is_active, plan_name')
        .eq('is_active', true)
        .neq('plan_name', 'none');

    const eligibleUsers = allUsers.filter(u => {
        const validUntil = u.valid_until ? new Date(u.valid_until) : null;
        const lastActivity = u.last_activity ? new Date(u.last_activity) : null;
        return (
            validUntil && validUntil > now &&
            lastActivity && lastActivity > sevenDaysAgo &&
            u.daily_limit > 0
        );
    });

    const usersWithCapacity = eligibleUsers.filter(u => u.leads_today < u.daily_limit);

    console.log('👥 USER CAPACITY:\n');
    console.log(`   Total eligible users: ${eligibleUsers.length}`);
    console.log(`   Users with capacity: ${usersWithCapacity.length}`);
    console.log(`   Users at limit: ${eligibleUsers.length - usersWithCapacity.length}\n`);

    // 2. Check recent orphan leads
    const today = new Date().toISOString().split('T')[0];
    const { data: recentOrphans } = await supabase
        .from('leads')
        .select('id, name, phone, gender, city, created_at')
        .is('user_id', null)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .order('created_at', { ascending: false })
        .limit(20);

    if (!recentOrphans || recentOrphans.length === 0) {
        console.log('✅ No recent orphan leads!\n');
        return;
    }

    console.log(`📍 Recent Orphan Leads (${recentOrphans.length}):\n`);

    // Gender breakdown
    const genderCount = {};
    recentOrphans.forEach(l => {
        const gender = l.gender || 'Unknown';
        genderCount[gender] = (genderCount[gender] || 0) + 1;
    });

    console.log('📊 Orphan Gender Breakdown:');
    console.table(Object.entries(genderCount).map(([g, c]) => ({ Gender: g, Count: c })));

    // User gender preferences
    const userGenderPref = {};
    eligibleUsers.forEach(u => {
        const pref = u.target_gender || 'Both';
        userGenderPref[pref] = (userGenderPref[pref] || 0) + 1;
    });

    console.log('\n👥 User Gender Preferences:');
    console.table(Object.entries(userGenderPref).map(([g, c]) => ({ Preference: g, Users: c })));

    // 3. Check if users at capacity
    const totalCapacity = eligibleUsers.reduce((sum, u) => sum + u.daily_limit, 0);
    const totalAssignedToday = eligibleUsers.reduce((sum, u) => sum + (u.leads_today || 0), 0);
    const remainingCapacity = totalCapacity - totalAssignedToday;

    console.log('\n📊 SYSTEM CAPACITY:\n');
    console.log(`   Total daily capacity: ${totalCapacity}`);
    console.log(`   Already assigned: ${totalAssignedToday}`);
    console.log(`   Remaining capacity: ${remainingCapacity}`);
    console.log(`   Today's orphans: ${recentOrphans.length}\n`);

    // 4. Possible causes
    console.log('💡 POSSIBLE CAUSES:\n');

    if (usersWithCapacity.length === 0) {
        console.log('   ❌ ALL USERS AT DAILY LIMIT - No capacity left!');
    } else if (remainingCapacity < recentOrphans.length) {
        console.log('   ⚠️ INSUFFICIENT CAPACITY - Not enough slots for all leads');
    } else {
        console.log('   ✅ Capacity available, likely filter mismatch:');

        if (genderCount.Male > 0 && userGenderPref.Female > userGenderPref.Male) {
            console.log('      - Gender mismatch: Male leads but more Female-only users');
        }
        if (genderCount.Female > 0 && userGenderPref.Male > userGenderPref.Female) {
            console.log('      - Gender mismatch: Female leads but more Male-only users');
        }

        console.log('      - State matching disabled but gender filter still active');
        console.log('      - Webhook might not be updated/deployed');
    }

    console.log('\n');
}

diagnoseOrphanCause();
