const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    const { data: princy } = await supabase
        .from('users')
        .select('*')
        .ilike('name', '%princy%')
        .limit(1)
        .single();

    if (princy) {
        console.log(`\n👤 PRINCY STATUS (${princy.email})`);
        console.log(`   Plan: ${princy.plan_name}`);
        console.log(`   Promised: ${princy.total_leads_promised}`);
        console.log(`   Received: ${princy.total_leads_received}`);
        console.log(`   Pending: ${princy.total_leads_promised - princy.total_leads_received}`);

        // Scan for multiple payments?
        const { data: pays } = await supabase.from('payments').select('*').eq('user_id', princy.id);
        console.log(`   Payments: ${pays?.length || 0}`);
        pays?.forEach(p => console.log(`   - ₹${p.amount} (${p.status})`));
    }
})();
