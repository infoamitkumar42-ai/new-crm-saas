const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://vewqzsqddgmkslnuctvb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us');

function getRandomTime() {
    const base = new Date('2026-02-24T10:30:00.000Z');
    const range = 2 * 60 * 60 * 1000;
    return new Date(base.getTime() + Math.floor(Math.random() * range)).toISOString();
}

async function main() {
    const email = 'kulwantsinghdhaliwalsaab668@gmail.com';
    const { data: users } = await supabase.from('users').select('id, name').eq('email', email);
    if (!users || users.length === 0) {
        console.log('User not found.');
        return;
    }
    const u = users[0];

    // 1. Reactivate user
    await supabase.from('users').update({ is_active: true }).eq('id', u.id);
    console.log('✅ ACTIVATED: ' + u.name);

    // 2. We revoked 5 leads from him. Grab 5 leads from the newly distributed batch (assigned to others)
    const { data: leadsToTake } = await supabase.from('leads').select('id, assigned_to')
        .gte('assigned_at', '2026-02-24T10:30:00Z') // After 4PM IST today
        .neq('assigned_to', u.id)
        .not('assigned_to', 'is', null) // Avoid taking orphans mistakenly
        .limit(5);

    if (!leadsToTake || leadsToTake.length < 5) {
        console.log('Not enough leads found to restore. Found: ' + (leadsToTake ? leadsToTake.length : 0));
        return;
    }

    // Save old owners to sync
    const oldOwners = new Set();

    // 3. Assign back to Kulwant
    let restored = 0;
    for (const l of leadsToTake) {
        oldOwners.add(l.assigned_to);
        const t = getRandomTime();
        await supabase.from('leads').update({
            assigned_to: u.id, user_id: u.id,
            assigned_at: t, created_at: t
        }).eq('id', l.id);
        restored++;
    }
    console.log('Restored ' + restored + ' leads back to ' + u.name);

    // 4. Temporarily bump his daily limit so the DB trigger doesn't block sync or further assignments
    // In fact we don't need to bump limit for syncing because we're just updating the user table, not assigning leads.
    // Sync Kulwant's leads_today
    const { count: kCount } = await supabase.from('leads').select('*', { count: 'exact', head: true })
        .eq('assigned_to', u.id).gte('created_at', '2026-02-23T18:30:00Z');
    await supabase.from('users').update({ leads_today: kCount || 0 }).eq('id', u.id);

    // Sync old owners
    for (const uid of Array.from(oldOwners)) {
        if (!uid) continue;
        const { count } = await supabase.from('leads').select('*', { count: 'exact', head: true })
            .eq('assigned_to', uid).gte('created_at', '2026-02-23T18:30:00Z');
        await supabase.from('users').update({ leads_today: count || 0 }).eq('id', uid);
    }

    console.log('Synced leads_today for all affected users.');
}

main().catch(console.error);
