import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkRLSAndInconsistency() {
    console.log('--- STEP 6: RLS and INCONSISTENCY CHECK ---');
    
    // Check for leads where assigned_to != user_id
    const { data: mismatches, error: mismatchErr } = await supabase
        .from('leads')
        .select('id, assigned_to, user_id')
        .not('assigned_to', 'is', null)
        .not('user_id', 'is', null);
        
    if (mismatchErr) {
        console.error('Error fetching leads for mismatch check:', mismatchErr);
    } else {
        const actualMismatches = mismatches.filter(l => l.assigned_to !== l.user_id);
        console.log(`Leads where assigned_to != user_id: ${actualMismatches.length}`);
        if (actualMismatches.length > 0) {
            console.table(actualMismatches.slice(0, 5));
        }
    }

    // Check for leads where assigned_to is set but user_id is null
    const { count: nullUserIdCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .not('assigned_to', 'is', null)
        .is('user_id', null);
    
    console.log(`Leads where assigned_to is set but user_id is NULL: ${nullUserIdCount}`);

    // Check for leads where user_id is set but assigned_to is null
    const { count: nullAssignedToCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .is('assigned_to', null)
        .not('user_id', 'is', null);
        
    console.log(`Leads where user_id is set but assigned_to is NULL: ${nullAssignedToCount}`);
}

checkRLSAndInconsistency().catch(console.error);
