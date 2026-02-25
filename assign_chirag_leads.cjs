const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://vewqzsqddgmkslnuctvb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us');

function getRandomTime() {
    // Today ~17:24 IST = 11:54 UTC. Random within last 2 hours
    const base = new Date('2026-02-23T10:00:00.000Z'); // ~3:30 PM IST
    const offsetMs = Math.floor(Math.random() * 2 * 60 * 60 * 1000);
    return new Date(base.getTime() + offsetMs).toISOString();
}

async function main() {
    // 1. Get all 33 unassigned Chirag+Bhumit leads
    const { data: chiragLeads } = await supabase.from('leads')
        .select('id').is('assigned_to', null).ilike('source', '%chirag%');
    const { data: bhumitLeads } = await supabase.from('leads')
        .select('id').is('assigned_to', null).ilike('source', '%bhumit%');

    const allLeadIds = [...(chiragLeads || []).map(l => l.id), ...(bhumitLeads || []).map(l => l.id)];
    console.log('Total leads to assign:', allLeadIds.length);

    // 2. Get Akshay + other active GJ01TEAMFIRE users
    const { data: akshay } = await supabase.from('users').select('id, name')
        .eq('email', 'akshaykapadiya33@gmail.com');
    const akshayId = akshay[0].id;

    const { data: others } = await supabase.from('users').select('id, name, email')
        .eq('team_code', 'GJ01TEAMFIRE').eq('is_active', true)
        .neq('email', 'akshaykapadiya33@gmail.com').order('name');

    // 3. Give Akshay first 15, rest to others round-robin
    const AKSHAY_COUNT = 15;
    const akshayLeads = allLeadIds.slice(0, AKSHAY_COUNT);
    const otherLeads = allLeadIds.slice(AKSHAY_COUNT);

    // Assign to Akshay
    for (const lid of akshayLeads) {
        const t = getRandomTime();
        await supabase.from('leads').update({
            assigned_to: akshayId, user_id: akshayId,
            assigned_at: t, created_at: t, notes: null, status: 'Assigned'
        }).eq('id', lid);
    }
    console.log('Akshay kapadiya: +' + akshayLeads.length + ' leads');

    // Round-robin to others
    const otherUsers = others.map(u => ({ ...u, assigned: 0 }));
    let idx = 0;
    for (const lid of otherLeads) {
        const user = otherUsers[idx % otherUsers.length];
        const t = getRandomTime();
        await supabase.from('leads').update({
            assigned_to: user.id, user_id: user.id,
            assigned_at: t, created_at: t, notes: null, status: 'Assigned'
        }).eq('id', lid);
        user.assigned++;
        idx++;
    }

    // Sync leads_today for all
    const allUsers = [{ id: akshayId, name: 'Akshay kapadiya', assigned: akshayLeads.length }, ...otherUsers];
    for (const u of allUsers) {
        const { count } = await supabase.from('leads').select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id).gte('created_at', '2026-02-22T18:30:00Z');
        await supabase.from('users').update({ leads_today: count || 0 }).eq('id', u.id);
    }

    console.log('\n=== DISTRIBUTION ===');
    allUsers.filter(u => u.assigned > 0).forEach(u => console.log(u.name + ': +' + u.assigned + ' leads'));
    console.log('\nTotal: ' + allLeadIds.length + ' leads distributed. leads_today synced.');
    console.log('DONE!');
}
main().catch(console.error);
