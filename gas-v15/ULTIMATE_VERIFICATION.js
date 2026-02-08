import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function ultimateVerification() {
    console.log('🎯 ============================================');
    console.log('     ULTIMATE SYSTEM VERIFICATION');
    console.log('     Time: ' + new Date().toLocaleString('en-IN'));
    console.log('============================================\n');

    // Check leads from last 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentLeads, error } = await supabase
        .from('leads')
        .select('status, created_at, assigned_to, user_id, name')
        .gte('created_at', oneHourAgo)
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

    console.log('📊 LAST 1 HOUR PERFORMANCE:');
    console.log(`   Total Leads: ${total}`);
    console.log(`   ✅ Assigned: ${assigned} (${total > 0 ? ((assigned / total) * 100).toFixed(1) : 0}%)`);
    console.log(`   ⏸️  Queued: ${queued}`);
    console.log(`   ❌ Invalid: ${invalid}`);
    console.log(`   🔁 Duplicate: ${duplicate}\n`);

    // Latest 5 leads
    console.log('📝 LATEST 5 LEADS:');
    recentLeads?.slice(0, 5).forEach((l, i) => {
        const time = new Date(l.created_at).toLocaleTimeString('en-IN');
        const status = l.status === 'Assigned' ? '✅' : l.status === 'Queued' ? '⏸️' : '❌';
        console.log(`   ${i + 1}. ${status} ${l.name} - ${l.status} at ${time}`);
    });

    // Check automation rate
    const validLeads = total - invalid - duplicate;
    const automationRate = validLeads > 0 ? ((assigned / validLeads) * 100).toFixed(1) : 0;

    console.log('\n\n🎯 AUTOMATION RATE: ' + automationRate + '%');

    if (automationRate >= 99) {
        console.log('   🎉 PERFECT! Fully automatic!\n');
    } else if (automationRate >= 90) {
        console.log('   ✅ EXCELLENT! Mostly automatic.\n');
    } else if (automationRate >= 75) {
        console.log('   ⚠️ GOOD but needs attention.\n');
    } else {
        console.log('   🔴 CRITICAL! System has issues.\n');
    }

    // Check recent errors
    const { data: recentErrors } = await supabase
        .from('webhook_errors')
        .select('*')
        .gte('created_at', oneHourAgo);

    console.log(`🔧 ERRORS (Last 1 hour): ${recentErrors?.length || 0}`);
    if (recentErrors && recentErrors.length > 0) {
        const errorTypes = {};
        recentErrors.forEach(e => {
            errorTypes[e.error_type] = (errorTypes[e.error_type] || 0) + 1;
        });
        Object.entries(errorTypes).forEach(([type, count]) => {
            console.log(`   - ${type}: ${count}`);
        });
    } else {
        console.log('   ✅ No errors!\n');
    }

    // Today's total
    const today = new Date().toISOString().split('T')[0];
    const { count: todayCount } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', today)
        .eq('status', 'Assigned');

    console.log('\n============================================');
    console.log('📈 TODAY\'S TOTAL: ' + (todayCount || 0) + ' leads assigned');
    console.log('============================================');
    console.log(`   STATUS: ${automationRate >= 99 ? '🟢 PERFECT' : automationRate >= 90 ? '🟡 EXCELLENT' : '🔴 NEEDS ATTENTION'}`);
    console.log('============================================\n');
}

ultimateVerification().catch(console.error);
