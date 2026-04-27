import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function globalAudit() {
    console.log('--- GLOBAL LEAD DISTRIBUTION ---');
    
    let allLeads = [];
    let from = 0;
    let step = 10000;
    console.log('Fetching leads in batches of 10k...');
    
    while (true) {
        const { data: leads, error } = await supabase
            .from('leads')
            .select('assigned_to, user_id')
            .range(from, from + step - 1);
        
        if (error) {
            console.error('Error:', error);
            break;
        }
        if (!leads || leads.length === 0) break;
        allLeads = allLeads.concat(leads);
        console.log(`Fetched ${allLeads.length} leads...`);
        from += step;
        if (leads.length < step) break;
    }

    const stats = {};
    allLeads.forEach(l => {
        const uid = l.assigned_to || l.user_id || 'unassigned';
        stats[uid] = (stats[uid] || 0) + 1;
    });

    const { data: users } = await supabase.from('users').select('id, name, email');
    const userMap = {};
    users?.forEach(u => userMap[u.id] = `${u.name} (${u.email})`);

    const results = Object.keys(stats).map(uid => ({
        user: userMap[uid] || uid,
        count: stats[uid]
    }));

    results.sort((a, b) => b.count - a.count);
    console.table(results.slice(0, 50));
}

globalAudit().catch(console.error);
