const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://vewqzsqddgmkslnuctvb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us');

async function run() {
    const email = 'ms028777@gmail.com';
    const { data: mandeep } = await s.from('users').select('id, name').eq('email', email).single();
    if (!mandeep) {
        console.log('Mandeep not found');
        return;
    }

    const today = new Date().toLocaleDateString('en-CA');
    const { data: leads } = await s.from('leads').select('id, name, status, assigned_at').eq('assigned_to', mandeep.id).gte('assigned_at', today + 'T00:00:00Z');

    console.log(`Mandeep (${mandeep.name}) leads today: ${leads.length}`);
    console.table(leads);

    const { data: teamfire } = await s.from('users').select('id, name, email').eq('team_code', 'TEAMFIRE').eq('is_active', true);

    const candidates = [];
    for (const u of teamfire) {
        const { count } = await s.from('leads').select('*', { count: 'exact', head: true }).eq('assigned_to', u.id).gte('assigned_at', today + 'T00:00:00Z');
        if (count === 1) {
            candidates.push({ id: u.id, name: u.name, email: u.email });
        }
    }

    if (candidates.length > 0) {
        console.log('\nPotential Recipients (Count = 1 today):');
        console.table(candidates);
    } else {
        console.log('\nNo one in TEAMFIRE has exactly 1 lead today.');
        // If no one has 1, maybe show counts to let me decide or ask user
        const allCounts = [];
        for (const u of teamfire) {
            const { count } = await s.from('leads').select('*', { count: 'exact', head: true }).eq('assigned_to', u.id).gte('assigned_at', today + 'T00:00:00Z');
            allCounts.push({ name: u.name, count });
        }
        console.table(allCounts.sort((a, b) => a.count - b.count));
    }
}

run();
