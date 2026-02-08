
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function detailedAudit() {
    const today = new Date().toISOString().split('T')[0];
    console.log(`--- FULL SYSTEM AUDIT FOR ${today} ---`);

    // 1. Fetch all leads
    const { data: leads } = await supabase.from('leads').select('*').gte('created_at', today + 'T00:00:00Z');

    // 2. Fetch all users
    const { data: users } = await supabase.from('users').select('id, name, team_code');
    const userMap = users.reduce((acc, u) => ({ ...acc, [u.id]: u }), {});

    // 3. Fetch all page mappings
    const { data: pages } = await supabase.from('meta_pages').select('*');

    console.log(`\nTOTAL LEADS IN DB: ${leads.length}`);

    const categories = {
        'RAJWINDER': [],
        'HIMANSHU': [],
        'CHIRAG': [],
        'UNKNOWN': []
    };

    leads.forEach(l => {
        const u = userMap[l.assigned_to];
        const leadStr = `${l.name} (${l.phone}) | Source: ${l.source} | Assigned: ${u ? u.name + ' (' + u.team_code + ')' : 'NONE'}`;

        const src = l.source.toLowerCase();
        if (src.includes('rajwinder')) categories['RAJWINDER'].push(leadStr);
        else if (src.includes('himanshu') || src.includes('landing page')) categories['HIMANSHU'].push(leadStr);
        else if (src.includes('new cbo') || src.includes('chirag') || src.includes('bhumit')) categories['CHIRAG'].push(leadStr);
        else categories['UNKNOWN'].push(leadStr);
    });

    console.log(`\n--- RAJWINDER LEADS (Count: ${categories['RAJWINDER'].length}) ---`);
    categories['RAJWINDER'].forEach(m => console.log(m));

    console.log(`\n--- HIMANSHU LEADS (Count: ${categories['HIMANSHU'].length}) ---`);
    categories['HIMANSHU'].forEach(m => console.log(m));

    console.log(`\n--- CHIRAG/CBO LEADS (Count: ${categories['CHIRAG'].length}) ---`);
    categories['CHIRAG'].forEach(m => console.log(m));

    console.log(`\n--- UNKNOWN/OTHER LEADS (Count: ${categories['UNKNOWN'].length}) ---`);
    categories['UNKNOWN'].forEach(m => console.log(m));
}

detailedAudit();
