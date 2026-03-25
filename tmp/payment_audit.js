import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const PLAN_CONFIG = {
    'starter': 55,
    'supervisor': 115,
    'weekly_boost': 92,
    'turbo_boost': 108,
    'manager': 176
};

async function checkPayments() {
    console.log('--- STEP 4: PAYMENT vs PROMISED ---');
    
    const { data: users, error: userErr } = await supabase
        .from('users')
        .select('id, email, name, plan_name, total_leads_promised, total_leads_received')
        .eq('is_active', true)
        .eq('payment_status', 'active');
        
    if (userErr) {
        console.error('Error fetching users:', userErr);
        return;
    }

    const results = [];

    for (const user of users) {
        const { data: payments, error: payErr } = await supabase
            .from('payments')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'captured');
            
        if (payErr) {
            console.error(`Error fetching payments for ${user.email}:`, payErr);
            continue;
        }

        let expectedPromised = 0;
        let history = [];
        payments.forEach(p => {
            const leads = PLAN_CONFIG[p.plan_name] || 0;
            expectedPromised += leads;
            history.push(`${p.plan_name}(${leads})`);
        });

        results.push({
            email: user.email,
            name: user.name,
            current_plan: user.plan_name,
            actual_promised: user.total_leads_promised,
            expected_promised: expectedPromised,
            diff: (user.total_leads_promised || 0) - expectedPromised,
            payments: history.join(' -> '),
            received: user.total_leads_received
        });
    }

    // Sort by diff
    results.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

    console.table(results);
}

checkPayments().catch(console.error);
