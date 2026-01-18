import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkSystemStatus() {
    console.log('\n📊 --- SYSTEM STATUS CHECK ---\n');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const now = new Date();
    const today = new Date().toISOString().split('T')[0];
    const todayStart = `${today}T00:00:00.000Z`;

    // 1. Check ACTIVE users count
    const { data: allActiveUsers } = await supabase
        .from('users')
        .select('name, plan_name, daily_limit, leads_today, valid_until, last_activity, is_active')
        .eq('is_active', true)
        .neq('plan_name', 'none');

    const eligibleUsers = allActiveUsers.filter(u => {
        const validUntil = u.valid_until ? new Date(u.valid_until) : null;
        const lastActivity = u.last_activity ? new Date(u.last_activity) : null;

        return (
            u.daily_limit > 0 &&
            validUntil && validUntil > now &&
            lastActivity && lastActivity > sevenDaysAgo
        );
    });

    const usersWithLeadsToday = eligibleUsers.filter(u => u.leads_today > 0);

    console.log('👥 ACTIVE USERS BREAKDOWN:');
    console.log(`   Total is_active=true: ${allActiveUsers.length}`);
    console.log(`   Eligible (subscription + activity valid): ${eligibleUsers.length}`);
    console.log(`   Currently receiving leads today: ${usersWithLeadsToday.length}`);
    console.log(`   Available capacity (not at limit): ${eligibleUsers.filter(u => u.leads_today < u.daily_limit).length}`);

    // 2. Check orphan/unassigned leads
    const { data: unassignedToday } = await supabase
        .from('leads')
        .select('id, name, city, state, status, created_at')
        .gte('created_at', todayStart)
        .is('user_id', null);

    console.log(`\n📍 UNASSIGNED LEADS TODAY: ${unassignedToday.length}`);
    if (unassignedToday.length > 0) {
        console.table(unassignedToday.map(l => ({
            Name: l.name,
            City: l.city,
            State: l.state || 'unknown',
            Status: l.status,
            Time: new Date(l.created_at).toLocaleTimeString()
        })));
    }

    // 3. Check yesterday night's orphans (if any)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];

    const nightStart = `${yesterdayDate}T16:30:00.000Z`; // 10 PM IST = 4:30 PM UTC
    const nightEnd = `${today}T02:30:00.000Z`; // 8 AM IST = 2:30 AM UTC

    const { data: nightLeads } = await supabase
        .from('leads')
        .select('id, name, user_id, status, created_at')
        .gte('created_at', nightStart)
        .lt('created_at', nightEnd);

    const assignedNightLeads = nightLeads.filter(l => l.user_id !== null);
    const unassignedNightLeads = nightLeads.filter(l => l.user_id === null);

    console.log(`\n🌙 LAST NIGHT LEADS (${yesterdayDate} 10PM - ${today} 8AM):`);
    console.log(`   Total: ${nightLeads.length}`);
    console.log(`   Assigned: ${assignedNightLeads.length}`);
    console.log(`   ⚠️ Still Unassigned: ${unassignedNightLeads.length}`);

    if (unassignedNightLeads.length > 0) {
        console.log('\n   Unassigned Night Leads:');
        console.table(unassignedNightLeads.map(l => ({
            Name: l.name,
            Status: l.status,
            Time: new Date(l.created_at).toLocaleString()
        })));
    }

    // 4. Overall distribution today
    const { count: totalLeadsToday } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart);

    const assignedCount = totalLeadsToday - unassignedToday.length;

    console.log(`\n📊 TODAY'S SUMMARY:`);
    console.log(`   Total Leads: ${totalLeadsToday}`);
    console.log(`   Assigned: ${assignedCount}`);
    console.log(`   Unassigned: ${unassignedToday.length}`);
    console.log(`   Distribution Rate: ${((assignedCount / totalLeadsToday) * 100).toFixed(1)}%`);
}

checkSystemStatus();
