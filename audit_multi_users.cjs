const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://vewqzsqddgmkslnuctvb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us');

(async () => {
    const emails = ['didar9915175976@gmail.com', 'neharajoria1543@gmail.com', 'jashandeepkaur6444@gmail.com'];
    for (const email of emails) {
        const { data: u } = await s.from('users').select('*').ilike('email', email).maybeSingle();
        if (!u) {
            console.log(`User ${email} NOT FOUND`);
            continue;
        }
        const { data: p } = await s.from('payments').select('*').eq('user_id', u.id).order('created_at', { ascending: false });
        const { count: leads } = await s.from('leads').select('*', { count: 'exact', head: true }).or(`user_id.eq.${u.id},assigned_to.eq.${u.id}`);
        const { data: firstLead } = await s.from('leads').select('created_at').or(`user_id.eq.${u.id},assigned_to.eq.${u.id}`).order('created_at', { ascending: true }).limit(1);

        console.log(`\n--- AUDIT: ${email} ---`);
        console.log(`Profile: id=${u.id}, name=${u.name}, active=${u.is_active}, today=${u.leads_today}`);
        console.log(`Payments: ${p ? p.length : 0} found`);
        (p || []).forEach(pay => console.log(` - ${pay.created_at}: ${pay.amount / 100} INR | status=${pay.status}`));
        console.log(`Total Leads: ${leads}`);
        console.log(`First Lead Received: ${firstLead?.[0]?.created_at || 'Never'}`);

        if (email === 'jashandeepkaur6444@gmail.com') {
            const { data: rec } = await s.from('leads').select('id, name, user_id, assigned_to, status, created_at').or(`user_id.eq.${u.id},assigned_to.eq.${u.id}`).order('created_at', { ascending: false }).limit(6);
            console.log(`Jashan Recent Leads:`, rec);
        }
    }
})();
