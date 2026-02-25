const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    const email = 'mandeep.k21@icloud.com';
    const renewalDate = '2026-02-09';
    const febStart = '2026-02-01';

    const { data: user } = await supabase.from('users').select('id').eq('email', email).single();

    // 1. Leads since Renewal (Feb 9)
    const { count: sinceRenewal } = await supabase.from('leads').select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id).gte('created_at', renewalDate + 'T00:00:00Z');

    // 2. Leads since Feb 1 (Calendar Month)
    const { count: sinceFeb1 } = await supabase.from('leads').select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id).gte('created_at', febStart + 'T00:00:00Z');

    const gap = (sinceFeb1 || 0) - (sinceRenewal || 0);

    console.log('--- 🕵️‍♂️ MANDEEP GAP ANALYSIS ---');
    console.log(`User: ${email}`);
    console.log(`Renewal Date: ${renewalDate}`);
    console.log(`Leads since Renewal (My Logic): ${sinceRenewal} (Pending: ${105 - sinceRenewal})`);
    console.log(`Leads since Feb 1 (User Logic?): ${sinceFeb1} (Pending: ${105 - sinceFeb1})`);
    console.log(`The GAP (Pre-renewal leads): ${gap}`);
    console.log('If we use Feb 1 logic, we cheat the user out of', gap, 'leads.');

})();
