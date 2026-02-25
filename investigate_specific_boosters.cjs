const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

const TARGETS = [
    { email: 'vansh.rajni.96@gmail.com', since: '2026-01-30T00:00:00', label: 'Since Jan 30' },
    { email: 'prince@gmail.com', since: '2026-01-01T00:00:00', label: 'Since Jan 1st (Full Audit)' },
    { email: 'samandeepkaur1216@gmail.com', since: '2026-02-14T00:00:00', label: 'Since Feb 14' },
    { email: 'loveleenkaur8285@gmail.com', since: '2026-02-12T00:00:00', label: 'Since Feb 12' },
    { email: 'rupanasameer551@gmail.com', since: '2026-02-08T00:00:00', label: 'Since Feb 8' }
];

(async () => {
    console.log(`=== 🕵️ SPECIFIC BOOSTER DEEP-DIVE ===\n`);

    for (const target of TARGETS) {
        console.log(`--- User: ${target.email} (${target.label}) ---`);

        // 1. Fetch User Info
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, name, email, plan_name, is_active, total_leads_promised, total_leads_received')
            .eq('email', target.email)
            .single();

        if (userError || !user) {
            console.log(`❌ User not found: ${target.email}\n`);
            continue;
        }

        // 2. Fetch Payments (Full History)
        const { data: payments } = await supabase
            .from('payments')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'captured')
            .order('created_at', { ascending: true });

        console.log(`Payments:`);
        if (payments && payments.length > 0) {
            payments.forEach(p => {
                console.log(`  - ${new Date(p.created_at).toLocaleDateString()} | ₹${p.amount} | Plan: ${p.plan_name}`);
            });
        } else {
            console.log(`  - No captured payments found.`);
        }

        // 3. Count Leads
        const { count: sinceCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', user.id)
            .gte('created_at', target.since);

        const { count: febCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', user.id)
            .gte('created_at', '2026-02-01T00:00:00');

        console.log(`Lead Counts:`);
        console.log(`  - Leads since ${target.since.split('T')[0]}: ${sinceCount}`);
        console.log(`  - Total Leads in Feb: ${febCount}`);
        console.log(`  - DB Total Received Counter: ${user.total_leads_received}`);
        console.log(`  - DB Total Promised Counter: ${user.total_leads_promised}\n`);
    }

})();
