import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function diagnoseChiragTeam() {
    console.log('🔍 DIAGNOSING CHIRAG TEAM LOADING ISSUE...\n');

    // 1. Check Chirag's team users
    console.log('1️⃣ CHECKING CHIRAG TEAM MEMBERS:');
    const { data: chiragUsers, error: e1 } = await supabase
        .from('users')
        .select('*')
        .eq('team_code', 'GJ01TEAMFIRE')
        .order('name');

    if (e1) {
        console.error('   ❌ Error fetching users:', e1.message);
    } else {
        console.log(`   Found ${chiragUsers?.length || 0} users in GJ01TEAMFIRE team`);
        chiragUsers?.forEach(u => {
            console.log(`   - ${u.name} (${u.email}) | Active: ${u.is_active} | Online: ${u.is_online}`);
        });
    }

    // 2. Check for any database locks or issues
    console.log('\n2️⃣ CHECKING FOR DATABASE ISSUES:');
    const { data: recentLeads, error: e2 } = await supabase
        .from('leads')
        .select('*')
        .limit(1);

    if (e2) {
        console.error('   ❌ Database connection issue:', e2.message);
    } else {
        console.log('   ✅ Database responding normally');
    }

    // 3. Check if there are any slow queries (check leads count)
    console.log('\n3️⃣ CHECKING CHIRAG TEAM LEADS:');
    const { count, error: e3 } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .in('user_id', chiragUsers?.map(u => u.id) || []);

    if (e3) {
        console.error('   ❌ Error counting leads:', e3.message);
    } else {
        console.log(`   Total leads for Chirag team: ${count || 0}`);
    }

    // 4. Check user permissions
    console.log('\n4️⃣ CHECKING USER PERMISSIONS:');
    const sampleUser = chiragUsers?.[0];
    if (sampleUser) {
        console.log(`   Sample User: ${sampleUser.name}`);
        console.log(`   - Role: ${sampleUser.role}`);
        console.log(`   - Is Active: ${sampleUser.is_active}`);
        console.log(`   - Is Online: ${sampleUser.is_online}`);
        console.log(`   - Manager ID: ${sampleUser.manager_id || 'None'}`);
    }

    // 5. Check if there's a specific page causing issues
    console.log('\n5️⃣ CHECKING META PAGES FOR CHIRAG:');
    const { data: chiragPages, error: e5 } = await supabase
        .from('meta_pages')
        .select('*')
        .eq('team_id', 'GJ01TEAMFIRE');

    if (e5) {
        console.error('   ❌ Error fetching pages:', e5.message);
    } else {
        console.log(`   Found ${chiragPages?.length || 0} pages`);
        chiragPages?.forEach(p => {
            console.log(`   - ${p.page_name} | Token: ${p.access_token ? 'Present' : 'Missing'}`);
        });
    }

    // 6. Check for any RLS policies blocking
    console.log('\n6️⃣ TESTING RLS POLICIES:');
    const { data: testQuery, error: e6 } = await supabase
        .from('users')
        .select('id, name')
        .eq('team_code', 'GJ01TEAMFIRE')
        .limit(1);

    if (e6) {
        console.error('   ❌ RLS might be blocking:', e6.message);
    } else {
        console.log('   ✅ RLS policies working normally');
    }

    console.log('\n✅ DIAGNOSIS COMPLETE\n');
}

diagnoseChiragTeam().catch(console.error);
