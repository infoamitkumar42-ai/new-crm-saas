import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runAudit() {
    console.log('--- STEP 2: COUNTER vs ACTUAL ---');
    
    // Fetch active users
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, email, name, plan_name, total_leads_received, total_leads_promised')
        .eq('is_active', true)
        .eq('payment_status', 'active');
    
    if (userError) {
        console.error('Error fetching users:', userError);
        return;
    }

    console.log(`Found ${users.length} active users.`);

    // Fetch all assigned leads (only id and assigned_to to save memory)
    // Since we have 23k leads, we can fetch them all in one go or batches.
    // Let's do batches of 10k.
    let allLeads = [];
    let from = 0;
    let step = 10000;
    while (true) {
        const { data: leads, error: leadError } = await supabase
            .from('leads')
            .select('id, assigned_to, user_id')
            .range(from, from + step - 1);
        
        if (leadError) {
            console.error('Error fetching leads:', leadError);
            break;
        }
        
        if (!leads || leads.length === 0) break;
        allLeads = allLeads.concat(leads);
        from += step;
        if (leads.length < step) break;
    }

    console.log(`Fetched ${allLeads.length} total leads.`);

    // Group leads by assigned_to and user_id
    const countByAssignedTo = {};
    const countByUserId = {};
    
    allLeads.forEach(l => {
        if (l.assigned_to) {
            countByAssignedTo[l.assigned_to] = (countByAssignedTo[l.assigned_to] || 0) + 1;
        }
        if (l.user_id) {
            countByUserId[l.user_id] = (countByUserId[l.user_id] || 0) + 1;
        }
    });

    const results = users.map(u => {
        const actualAssigned = countByAssignedTo[u.id] || 0;
        const actualUserId = countByUserId[u.id] || 0;
        return {
            email: u.email,
            name: u.name,
            plan: u.plan_name,
            counter: u.total_leads_received,
            actual_assigned: actualAssigned,
            actual_user_id: actualUserId,
            mismatch: (u.total_leads_received || 0) - actualAssigned
        };
    });

    // Sort by mismatch DESC
    results.sort((a, b) => b.mismatch - a.mismatch);

    console.table(results);
}

runAudit().catch(console.error);
