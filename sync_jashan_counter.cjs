const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://vewqzsqddgmkslnuctvb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us');

(async () => {
    try {
        const jEmail = 'jashandeepkaur6444@gmail.com';
        const { data: u, error: uErr } = await s.from('users').select('id, name').ilike('email', jEmail).single();
        if (uErr || !u) return console.error('User not found');

        const todayStart = new Date().toISOString().split('T')[0] + 'T00:00:00Z';
        const { count, error: lErr } = await s.from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id)
            .gte('created_at', todayStart);

        if (lErr) return console.error('Error fetching leads:', lErr);

        const { error: upErr } = await s.from('users').update({ leads_today: count }).eq('id', u.id);
        if (upErr) return console.error('Error updating user:', upErr);

        console.log(`✅ Success! ${u.name}'s counter updated to ${count}.`);
    } catch (err) {
        console.error('Unexpected error:', err.message);
    }
})();
