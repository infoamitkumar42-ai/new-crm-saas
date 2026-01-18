import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkAuthHealth() {
    console.log('🔍 --- ANALYZING AUTHENTICATION HEALTH ---\n');

    // 1. Fetch Public Users (The ones visible in dashboard)
    const { data: publicUsers, error: publicError } = await supabase
        .from('users')
        .select('id, name, email, is_active, created_at');

    if (publicError) { console.error('Public fetch error:', publicError); return; }

    console.log(`📊 Public Database Users: ${publicUsers.length}`);

    // 2. Fetch Auth Users (Verified via pagination if needed, but assuming simple list works for now)
    // .listUsers() returns { data: { users: [] }, error }
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers({ perPage: 1000 });

    if (authError) { console.error('Auth fetch error:', authError); return; }

    console.log(`🔐 Auth System Users: ${authUsers.length}`);

    // Map for checking
    const authMap = new Map();
    authUsers.forEach(u => authMap.set(u.id, u));

    const issues = {
        missingInAuth: [],
        notConfirmed: [],
        mismatchedEmail: [],
        neverSignedIn: [],
        suspended: []
    };

    // 3. Compare Public vs Auth
    for (const pUser of publicUsers) {
        const aUser = authMap.get(pUser.id);

        if (!aUser) {
            issues.missingInAuth.push(pUser);
            continue;
        }

        // Check verification
        if (!aUser.email_confirmed_at && !aUser.phone_confirmed_at) {
            issues.notConfirmed.push({ name: pUser.name, email: aUser.email, created: aUser.created_at });
        }

        // Check Sign In
        if (!aUser.last_sign_in_at) {
            issues.neverSignedIn.push({ name: pUser.name, email: pUser.email });
        }

        // Check Mismatch
        if (aUser.email?.toLowerCase() !== pUser.email?.toLowerCase()) {
            issues.mismatchedEmail.push({ pub: pUser.email, auth: aUser.email });
        }

        // Suspended?
        if (aUser.banned_until && new Date(aUser.banned_until) > new Date()) {
            issues.suspended.push(pUser.name);
        }
    }

    // 4. Report
    console.log('\n🚨 ISSUES FOUND:');

    if (issues.missingInAuth.length > 0) {
        console.log(`\n❌ MISSING IN AUTH (${issues.missingInAuth.length} users exist in DB but NOT in Auth - Cannot Login):`);
        issues.missingInAuth.forEach(u => console.log(`   - ${u.name} (${u.email})`));
    } else {
        console.log('✅ Auth Consistency: OK (All public users exist in Auth)');
    }

    console.log(`\n📧 NOT CONFIRMED (${issues.notConfirmed.length} users):`);
    if (issues.notConfirmed.length > 0) {
        issues.notConfirmed.forEach(u => console.log(`   - ${u.name} (${u.email})`));
    } else {
        console.log("   (None)");
    }

    console.log(`\n🚪 NEVER LOGGED IN (${issues.neverSignedIn.length} users):`);
    if (issues.neverSignedIn.length > 0) {
        // Show all if reasonable, otherwise limit
        issues.neverSignedIn.forEach(u => console.log(`   - ${u.name} (${u.email})`));
    } else {
        console.log("   (None)");
    }

    if (issues.mismatchedEmail.length > 0) {
        console.log(`\n⚠️ EMAIL MISMATCH:`, issues.mismatchedEmail);
    }

    if (issues.suspended.length > 0) {
        console.log(`\n🚫 BANNED USERS:`, issues.suspended);
    }

    console.log('\n--- ANALYSIS COMPLETE ---');
}

checkAuthHealth();
