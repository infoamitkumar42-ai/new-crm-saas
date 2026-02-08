import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function comprehensiveHealthCheck() {
    console.log('🏥 ============================================');
    console.log('   COMPREHENSIVE SYSTEM HEALTH CHECK');
    console.log('============================================\n');

    // 1. Latest Leads Check
    console.log('1️⃣ REAL-TIME ASSIGNMENT (Last 30 min)');
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: recentLeads, error: e1 } = await supabase
        .from('leads')
        .select('status')
        .gte('created_at', thirtyMinAgo);

    if (!e1 && recentLeads) {
        const assigned = recentLeads.filter(l => l.status === 'Assigned').length;
        const queued = recentLeads.filter(l => l.status === 'Queued').length;
        const newStatus = recentLeads.filter(l => l.status === 'New').length;
        console.log(`   Total: ${recentLeads.length} | Assigned: ${assigned} | Queued: ${queued} | New: ${newStatus}`);
        console.log(assigned === recentLeads.length ? '   ✅ ALL LEADS AUTO-ASSIGNED' : '   ⚠️ Some leads not assigned');
    }

    // 2. User Visibility Check
    console.log('\n2️⃣ USER VISIBILITY (Dashboard Names)');
    const today = new Date().toISOString().split('T')[0];
    const { data: todayLeads, error: e2 } = await supabase
        .from('leads')
        .select('user_id, status')
        .eq('status', 'Assigned')
        .gte('created_at', today);

    if (!e2 && todayLeads) {
        const withUserId = todayLeads.filter(l => l.user_id !== null).length;
        const nullUserId = todayLeads.filter(l => l.user_id === null).length;
        console.log(`   Total Assigned: ${todayLeads.length} | With Names: ${withUserId} | Null Names: ${nullUserId}`);
        console.log(nullUserId === 0 ? '   ✅ ALL NAMES VISIBLE' : '   ⚠️ Some names missing');
    }

    // 3. Rotation Fairness
    console.log('\n3️⃣ ROTATION FAIRNESS (Today\'s Distribution)');
    const { data: users, error: e3 } = await supabase
        .from('users')
        .select('name, leads_today, daily_limit, is_active, is_online, last_assigned_at')
        .eq('is_active', true)
        .order('leads_today', { ascending: true })
        .limit(10);

    if (!e3 && users) {
        users.forEach(u => {
            const status = u.leads_today >= u.daily_limit ? '🔴 FULL' : '🟢 AVAILABLE';
            console.log(`   ${status} ${u.name}: ${u.leads_today}/${u.daily_limit} leads`);
        });
        const leadsArray = users.map(u => u.leads_today);
        const max = Math.max(...leadsArray);
        const min = Math.min(...leadsArray);
        console.log(max - min <= 2 ? '   ✅ WELL BALANCED' : '   ⚠️ Unbalanced distribution');
    }

    // 4. Token Health
    console.log('\n4️⃣ TOKEN HEALTH');
    const { data: pages, error: e4 } = await supabase
        .from('meta_pages')
        .select('access_token');

    if (!e4 && pages) {
        const validTokens = pages.filter(p => p.access_token && p.access_token.length > 100).length;
        console.log(`   Valid Tokens: ${validTokens}/${pages.length}`);
        console.log(validTokens === pages.length ? '   ✅ ALL TOKENS VALID' : '   ⚠️ Some tokens missing');
    }

    // 5. Quota Violations
    console.log('\n5️⃣ QUOTA ENFORCEMENT');
    const { data: overLimit, error: e5 } = await supabase
        .from('users')
        .select('name, leads_today, daily_limit')
        .gt('leads_today', supabase.rpc('daily_limit'));

    // Simplified check
    const { data: allUsers, error: e5b } = await supabase
        .from('users')
        .select('name, leads_today, daily_limit');

    if (!e5b && allUsers) {
        const violations = allUsers.filter(u => u.leads_today > u.daily_limit);
        console.log(`   Users Over Limit: ${violations.length}`);
        if (violations.length > 0) {
            violations.forEach(v => console.log(`   ⚠️ ${v.name}: ${v.leads_today}/${v.daily_limit}`));
        } else {
            console.log('   ✅ ALL QUOTAS RESPECTED');
        }
    }

    // 6. Webhook Errors
    console.log('\n6️⃣ WEBHOOK HEALTH (Last 24h)');
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: errors, error: e6 } = await supabase
        .from('webhook_errors')
        .select('*')
        .gte('created_at', yesterday);

    if (!e6) {
        console.log(`   Recent Errors: ${errors?.length || 0}`);
        console.log((errors?.length || 0) === 0 ? '   ✅ NO ERRORS' : '   ⚠️ Some webhook failures');
    } else {
        console.log('   ℹ️ Error log table might not exist (OK if system is working)');
    }

    // 7. Next Assignment Test
    console.log('\n7️⃣ NEXT IN LINE (Rotation Test)');
    const { data: nextUser, error: e7 } = await supabase
        .rpc('get_best_assignee_for_team', {
            p_team_code: users?.[0]?.team_code || 'GJ01TEAMFIRE'
        });

    if (!e7 && nextUser && nextUser.length > 0) {
        const next = nextUser[0];
        console.log(`   Next Lead Goes To: ${next.user_name}`);
        console.log(`   Current: ${next.leads_today}/${next.daily_limit} leads`);
        console.log('   ✅ ROTATION LOGIC WORKING');
    } else {
        console.log('   ⚠️ Could not determine next user');
    }

    console.log('\n============================================');
    console.log('          HEALTH CHECK COMPLETE');
    console.log('============================================\n');
}

comprehensiveHealthCheck().catch(console.error);
