const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

const EMAIL = 'jk419473@gmail.com';

(async () => {
    console.log(`=== 🕵️ DEEP DIVE: Jashandeep Kaur (${EMAIL}) ===`);

    // 1. User Table Data
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', EMAIL)
        .single();

    if (userError) { console.error('Error fetching user:', userError); return; }

    console.log('\n--- CURRENT DB STATUS ---');
    console.log(`Plan: ${user.plan_name}`);
    console.log(`Promised leads: ${user.total_leads_promised}`);
    console.log(`Received leads (Counter): ${user.total_leads_received}`);
    console.log(`Pending calculated: ${user.total_leads_promised - user.total_leads_received}`);

    // 2. Payment Audit
    const { data: payments, error: payError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'captured')
        .order('created_at', { ascending: true });

    console.log('\n--- PAYMENT HISTORY ---');
    payments.forEach(p => {
        console.log(`- Date: ${new Date(p.created_at).toLocaleDateString()} | Amount: ₹${p.amount} | Plan: ${p.plan_name}`);
    });

    // 3. Lead Usage Breakdown
    console.log('\n--- LEAD USAGE AUDIT ---');

    // Total leads ever
    const { count: totalLeadsEver } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id);

    console.log(`Total Leads Ever Assigned: ${totalLeadsEver}`);

    // Leads in Jan
    const { count: janLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id)
        .gte('created_at', '2026-01-01T00:00:00')
        .lte('created_at', '2026-01-31T23:59:59');

    console.log(`Leads assigned in Jan: ${janLeads}`);

    // Leads in Feb (since Feb 3rd)
    const { count: febLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id)
        .gte('created_at', '2026-02-01T00:00:00');

    console.log(`Leads assigned in Feb (Total): ${febLeads}`);

    const { count: sinceFeb3 } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id)
        .gte('created_at', '2026-02-03T00:00:00');

    console.log(`Leads assigned SINCE Feb 3rd: ${sinceFeb3}`);

    console.log('\n--- EXPLANATION CALCULATION ---');
    // Each booster = 108 leads? Let's check plan mapping.
    // ₹1999 = 105 leads or 108? 
    // ₹3998 = 2 x 108 = 216?

    console.log(`Calculation logic will be explained based on these numbers.`);

})();
