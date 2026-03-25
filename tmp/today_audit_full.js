import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fullTodayAudit() {
    console.log('--- FULL TODAY AUDIT (18 March 2026) ---');
    const startOfDay = '2026-03-18T00:00:00+05:30';
    
    // 1. Fetch all leads assigned today
    const { data: todayLeads, error } = await supabase
        .from('leads')
        .select('id, assigned_to, user_id, source, status, created_at')
        .gte('created_at', startOfDay);
    
    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Total leads in DB with created_at >= today: ${todayLeads.length}`);

    // 2. Count by unique users
    const userStats = {};
    todayLeads.forEach(l => {
        const uid = l.assigned_to || l.user_id || 'unassigned';
        if (!userStats[uid]) userStats[uid] = 0;
        userStats[uid]++;
    });

    // 3. Map user names
    const { data: users } = await supabase.from('users').select('id, name, email');
    const userMap = {};
    users?.forEach(u => userMap[u.id] = `${u.name} (${u.email})`);

    const finalResults = Object.keys(userStats).map(uid => ({
        user: userMap[uid] || uid,
        count: userStats[uid]
    }));

    finalResults.sort((a, b) => b.count - a.count);
    console.table(finalResults);
}

fullTodayAudit().catch(console.error);
