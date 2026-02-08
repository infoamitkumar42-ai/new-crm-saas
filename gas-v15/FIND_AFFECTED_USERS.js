import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function findAffectedUsers() {
    console.log('🔍 FINDING USERS WITH LOADING ISSUES\n');
    console.log('============================================\n');

    // Get all auth users
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers({
        perPage: 1000
    });

    console.log(`Total Auth Users: ${authUsers?.length}\n`);

    // Check last sign in patterns
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const todayStart = new Date(now.toISOString().split('T')[0]);

    // Users who tried to login recently but might be stuck
    const recentAttempts = authUsers?.filter(u => {
        if (!u.last_sign_in_at) return false;
        const lastSignIn = new Date(u.last_sign_in_at);
        return lastSignIn >= todayStart;
    });

    console.log(`📊 Users who logged in today: ${recentAttempts?.length}\n`);

    // Focus on Chirag team
    const chiragTeamEmails = authUsers?.filter(u => {
        // Get users from GJ01TEAMFIRE
        return u.email?.toLowerCase().includes('chirag') ||
            u.user_metadata?.team_code === 'GJ01TEAMFIRE';
    });

    console.log('1️⃣ CHIRAG TEAM LOGIN ACTIVITY:\n');

    // Get all GJ01TEAMFIRE users from DB
    const { data: chiragDbUsers } = await supabase
        .from('users')
        .select('email, name, last_activity')
        .eq('team_code', 'GJ01TEAMFIRE')
        .eq('is_active', true);

    console.log(`Active Chirag Team Members: ${chiragDbUsers?.length}\n`);

    // Check who logged in vs who didn't
    const loggedInToday = new Set();
    recentAttempts?.forEach(u => loggedInToday.add(u.email));

    const potentiallyAffected = chiragDbUsers?.filter(u => {
        // Active users who haven't logged in today
        return !loggedInToday.has(u.email);
    });

    console.log('⚠️ POTENTIALLY AFFECTED (Active but not logged in today):');
    console.log(`   Count: ${potentiallyAffected?.length}\n`);

    potentiallyAffected?.slice(0, 10).forEach((u, i) => {
        console.log(`   ${i + 1}. ${u.name} (${u.email})`);
    });

    // Users with very recent sign-ins (might be retrying)
    const oneHourAttempts = authUsers?.filter(u => {
        if (!u.last_sign_in_at) return false;
        const lastSignIn = new Date(u.last_sign_in_at);
        return lastSignIn >= oneHourAgo;
    }).filter(u => {
        // Check if they're from Chirag team
        const dbUser = chiragDbUsers?.find(db => db.email === u.email);
        return !!dbUser;
    });

    console.log(`\n\n🔴 RECENTLY TRIED (Last 1 hour - might be stuck):`);
    console.log(`   Count: ${oneHourAttempts?.length}\n`);

    oneHourAttempts?.forEach((u, i) => {
        const dbUser = chiragDbUsers?.find(db => db.email === u.email);
        console.log(`   ${i + 1}. ${dbUser?.name || 'Unknown'} (${u.email})`);
        console.log(`      Last Sign In: ${new Date(u.last_sign_in_at).toLocaleTimeString('en-IN')}`);
    });

    console.log('\n\n============================================');
    console.log('📋 SUMMARY:');
    console.log('============================================');
    console.log(`Total Chirag Team (Active): ${chiragDbUsers?.length}`);
    console.log(`Logged in today: ${chiragDbUsers?.length - (potentiallyAffected?.length || 0)}`);
    console.log(`Not logged in yet: ${potentiallyAffected?.length}`);
    console.log(`Recent attempts (1h): ${oneHourAttempts?.length}`);
    console.log('============================================\n');

    console.log('💡 RECOMMENDATION:');
    if (oneHourAttempts && oneHourAttempts.length > 0) {
        console.log(`   ${oneHourAttempts.length} users tried recently - they likely have loading issue`);
        console.log('   Send them PWA reinstall instructions!\n');
    } else {
        console.log('   No recent stuck users detected\n');
    }
}

findAffectedUsers().catch(console.error);
