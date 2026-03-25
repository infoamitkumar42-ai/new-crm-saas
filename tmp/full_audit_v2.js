import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fullAudit() {
    console.log('--- FULL PAGINATED AUDIT ---');
    
    let allLeads = [];
    let from = 0;
    let step = 1000; // Correct step for Supabase REST API default limit
    
    while (true) {
        const { data: leads, error } = await supabase
            .from('leads')
            .select('id, assigned_to, user_id, source, status, created_at, assigned_at')
            .range(from, from + step - 1);
        
        if (error) {
            console.error('Error at range', from, error);
            break;
        }
        if (!leads || leads.length === 0) break;
        
        allLeads = allLeads.concat(leads);
        from += step;
        
        if (leads.length < step) break;
        
        if (from % 5000 === 0) console.log(`Fetched ${from} leads...`);
    }

    console.log(`Total Leads Analyzed: ${allLeads.length}`);

    // stats
    const userStats = {};
    const sourceStats = {};
    const statusStats = {};
    const today = '2026-03-18';
    let todayCount = 0;
    const todayUserStats = {};

    allLeads.forEach(l => {
        // Global
        const uid = l.assigned_to || l.user_id || 'unassigned';
        userStats[uid] = (userStats[uid] || 0) + 1;
        
        sourceStats[l.source] = (sourceStats[l.source] || 0) + 1;
        statusStats[l.status] = (statusStats[l.status] || 0) + 1;

        // Today (using created_at or assigned_at)
        const isToday = (l.created_at && l.created_at.startsWith(today)) || (l.assigned_at && l.assigned_at.startsWith(today));
        if (isToday) {
            todayCount++;
            todayUserStats[uid] = (todayUserStats[uid] || 0) + 1;
        }
    });

    console.log(`\nLeads touched today: ${todayCount}`);

    // Map users
    const { data: users } = await supabase.from('users').select('id, name, email');
    const userMap = {};
    users?.forEach(u => userMap[u.id] = `${u.name} (${u.email})`);

    console.log('\nTop 20 Users Total:');
    const sortedUsers = Object.keys(userStats).map(k => ({ user: userMap[k] || k, count: userStats[k] })).sort((a,b) => b.count - a.count);
    console.table(sortedUsers.slice(0, 20));

    console.log('\nTop 20 Users TODAY (18 March):');
    const sortedTodayUsers = Object.keys(todayUserStats).map(k => ({ user: userMap[k] || k, count: todayUserStats[k] })).sort((a,b) => b.count - a.count);
    console.table(sortedTodayUsers.slice(0, 20));
}

fullAudit().catch(console.error);
