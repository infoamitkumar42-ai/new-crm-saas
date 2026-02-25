const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log('=== COUNTING LEADS SINCE RENEWAL ===');

    const targets = [
        { email: 'dbrar8826@gmail.com', renewDate: '2026-02-05T00:00:00Z', payId: 'Feb 5' },
        { email: 'sipreet73@gmail.com', renewDate: '2026-02-09T00:00:00Z', payId: 'Feb 9' }
    ];

    for (const target of targets) {
        // Get User ID
        const { data: user } = await supabase.from('users').select('id').eq('email', target.email).single();
        if (!user) continue;

        // Count Leads assigned AFTER renewal date
        const { count, error } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', user.id)
            .gte('assigned_at', target.renewDate);

        if (error) console.error('Error:', error.message);
        else console.log(`User: ${target.email}\nRenewed: ${target.payId}\nLeads Received Since: ${count}\n----------------`);
    }
})();
