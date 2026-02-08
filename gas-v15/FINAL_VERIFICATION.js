import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function finalVerification() {
    console.log('🎯 ============================================');
    console.log('     FINAL AUTOMATION VERIFICATION');
    console.log('============================================\n');

    // Check leads from last 30 minutes
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: recentLeads, error } = await supabase
        .from('leads')
        .select('status, created_at')
        .gte('created_at', thirtyMinAgo)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    const total = recentLeads?.length || 0;
    const assigned = recentLeads?.filter(l => l.status === 'Assigned').length || 0;
    const queued = recentLeads?.filter(l => l.status === 'Queued').length || 0;
    const invalid = recentLeads?.filter(l => l.status === 'Invalid').length || 0;
    const duplicate = recentLeads?.filter(l => l.status === 'Duplicate').length || 0;

    console.log('📊 LAST 30 MINUTES:');
    console.log(`   Total Leads: ${total}`);
    console.log(`   ✅ Assigned: ${assigned}`);
    console.log(`   ⏸️  Queued: ${queued}`);
    console.log(`   ❌ Invalid: ${invalid}`);
    console.log(`   🔁 Duplicate: ${duplicate}\n`);

    const validLeads = total - invalid - duplicate;
    const automationRate = validLeads > 0 ? ((assigned / validLeads) * 100).toFixed(1) : 0;

    console.log(`🎯 AUTOMATION RATE: ${automationRate}%`);

    if (automationRate >= 99) {
        console.log('   🎉 EXCELLENT! System is fully automatic!\n');
    } else if (automationRate >= 90) {
        console.log('   ✅ GOOD! System is mostly automatic.\n');
    } else {
        console.log('   ⚠️ NEEDS ATTENTION! System has issues.\n');
    }

    // Check for recent errors (last 10 min)
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recentErrors } = await supabase
        .from('webhook_errors')
        .select('*')
        .gte('created_at', tenMinAgo);

    console.log(`🔧 RECENT ERRORS (Last 10 min): ${recentErrors?.length || 0}`);

    if (!recentErrors || recentErrors.length === 0) {
        console.log('   ✅ No recent errors!\n');
    } else {
        console.log('   ⚠️ Some errors detected\n');
        recentErrors.forEach(e => {
            console.log(`   - ${e.error_type} at ${e.created_at}`);
        });
    }

    // Check quota violations
    const { data: users } = await supabase
        .from('users')
        .select('name, leads_today, daily_limit')
        .gt('leads_today', supabase.sql`daily_limit`);

    const violations = users?.filter(u => u.leads_today > u.daily_limit) || [];

    console.log(`\n🚦 QUOTA VIOLATIONS: ${violations.length}`);
    if (violations.length > 0) {
        violations.forEach(v => {
            console.log(`   ⚠️ ${v.name}: ${v.leads_today}/${v.daily_limit}`);
        });
    } else {
        console.log('   ✅ All limits respected!');
    }

    console.log('\n============================================');
    console.log(`        SYSTEM STATUS: ${automationRate >= 99 ? '🟢 PERFECT' : automationRate >= 90 ? '🟡 GOOD' : '🔴 NEEDS FIX'}`);
    console.log('============================================\n');
}

finalVerification().catch(console.error);
