import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function simpleOrphanCheck() {
    console.log('\n📊 --- SIMPLE ORPHAN CHECK ---\n');

    // Total orphans
    const { count: total } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .is('user_id', null);

    console.log(`Total orphan leads: ${total}\n`);

    // Today's orphans (IST timezone adjustment)
    const { count: today } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .is('user_id', null)
        .gte('created_at', '2026-01-16T18:30:00.000Z'); // Jan 17 00:00 IST

    console.log(`Today's orphans (Jan 17 IST): ${today}\n`);

    // Get sample orphans
    const { data: samples } = await supabase
        .from('leads')
        .select('name, phone, city, created_at, status')
        .is('user_id', null)
        .order('created_at', { ascending: false })
        .limit(10);

    console.log('Recent 10 orphans:\n');
    samples?.forEach(l => {
        const time = new Date(l.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        console.log(`   ${l.name} - ${l.city} (${time})`);
    });

    // Check user capacity
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: users } = await supabase
        .from('users')
        .select('daily_limit, leads_today, valid_until, last_activity, is_active')
        .eq('is_active', true);

    const eligible = users.filter(u => {
        const validUntil = u.valid_until ? new Date(u.valid_until) : null;
        const lastActivity = u.last_activity ? new Date(u.last_activity) : null;
        return validUntil && validUntil > now && lastActivity && lastActivity > sevenDaysAgo && u.daily_limit > 0;
    });

    const atLimit = eligible.filter(u => u.leads_today >= u.daily_limit).length;
    const withCapacity = eligible.filter(u => u.leads_today < u.daily_limit).length;

    console.log(`\n👥 Users: ${eligible.length} eligible`);
    console.log(`   ${atLimit} at limit, ${withCapacity} with capacity\n`);

    console.log('💡 ROOT CAUSE:\n');
    if (withCapacity === 0) {
        console.log('   ❌ ALL USERS AT DAILY LIMIT');
        console.log('   Solution: Increase daily limits or add more users\n');
    } else if (today > 0) {
        console.log('   ⚠️ Users available but leads not assigning');
        console.log('   Possible reasons:');
        console.log('   - Gender mismatch (filter still active)');
        console.log('   - Webhook not updated/deployed');
        console.log('   - State filter not fully disabled\n');
    } else {
        console.log('   ✅ System healthy - orphans are old leads\n');
    }
}

simpleOrphanCheck();
