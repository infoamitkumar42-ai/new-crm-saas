const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkFlow() {
    const today = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
    console.log(`--- LEAD FLOW CHECK for 2026-02-10 ---`);

    // Team codes
    const teams = {
        'Himanshu': 'TEAMFIRE',
        'Chirag': 'GJ01TEAMFIRE'
    };

    for (const [name, code] of Object.entries(teams)) {
        // Get users in team
        const { data: users } = await supabase.from('users').select('id').eq('team_code', code);
        const ids = users.map(u => u.id);

        // Get leads count for today
        const { count } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .in('assigned_to', ids)
            .gte('created_at', today);

        console.log(`${name} Team (${code}): ${count || 0} leads today.`);
    }

    // Check specific form_id from Himanshu's new page integration
    const { count: hNewPageCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('form_id', '3958438997779886')
        .gte('created_at', today);
    console.log(`\nHimanshu's New Form (ID: 3958438997779886): ${hNewPageCount || 0} leads.`);

    // Check recent source strings today to see if new pages are named differently
    const { data: recentLeads } = await supabase
        .from('leads')
        .select('source, created_at')
        .gte('created_at', today)
        .order('created_at', { ascending: false })
        .limit(20);

    if (recentLeads && recentLeads.length > 0) {
        const sources = [...new Set(recentLeads.map(l => l.source))];
        console.log('\nRecent Individual Sources Today:', sources);
        console.log(`Last lead arrived at: ${recentLeads[0].created_at}`);
    } else {
        console.log('\nNo leads found at all for today yet.');
    }
}

checkFlow();
