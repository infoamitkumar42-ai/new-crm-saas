const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://vewqzsqddgmkslnuctvb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us');

async function audit() {
    const start = '2026-02-13T00:00:00+05:30';
    console.log(`Auditing leads assigned since ${start} (IST)...`);

    const { data: users } = await s.from('users').select('id, name, email').eq('team_code', 'TEAMFIRE').eq('is_active', true);
    if (!users) return console.log('No active TEAMFIRE users found.');

    const ids = users.map(u => u.id);

    // 1. Audit assigned_to
    const { data: atLeads } = await s.from('leads').select('assigned_to').in('assigned_to', ids).gte('created_at', start);
    const atCounts = {};
    if (atLeads) atLeads.forEach(l => atCounts[l.assigned_to] = (atCounts[l.assigned_to] || 0) + 1);

    // 2. Audit user_id
    const { data: uiLeads } = await s.from('leads').select('user_id').in('user_id', ids).gte('created_at', start);
    const uiCounts = {};
    if (uiLeads) uiLeads.forEach(l => uiCounts[l.user_id] = (uiCounts[l.user_id] || 0) + 1);

    console.log('\nResults for TEAMFIRE:');
    const report = users.map(u => ({
        name: u.name,
        email: u.email,
        via_assigned_to: atCounts[u.id] || 0,
        via_user_id: uiCounts[u.id] || 0
    })).filter(r => r.via_assigned_to > 0 || r.via_user_id > 0);

    console.table(report);

    // Specifically check Gurpreet
    const gurpreet = users.find(u => u.email === 'gjama1979@gmail.com');
    if (gurpreet) {
        console.log(`\nGurpreet (${gurpreet.id}):`);
        console.log(`- leads_today (assigned_to): ${atCounts[gurpreet.id] || 0}`);
        console.log(`- leads_today (user_id): ${uiCounts[gurpreet.id] || 0}`);
    }
}

audit();
