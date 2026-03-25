import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkHiddenAssignments() {
    const email = 'samandeepkaur1216@gmail.com';
    const { data: user } = await supabase.from('users').select('id').eq('email', email).single();
    if (!user) return;

    console.log(`Checking for ${email}...`);

    // 1. Check temp_assigned_email
    const { count: tempCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('temp_assigned_email', email);
    
    console.log(`Leads with temp_assigned_email = ${email}: ${tempCount}`);

    // 2. Check manager_id
    const { count: managerCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('manager_id', user.id);
    
    console.log(`Leads with manager_id = ${user.id}: ${managerCount}`);

    // 3. Check for any lead with email in notes
    const { count: notesCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .ilike('notes', `%${email}%`);
    
    console.log(`Leads with email in notes: ${notesCount}`);

    // 4. Check status 'Manual' or similar
    const { count: manualStatusCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Manual');
    
    console.log(`Leads with status 'Manual': ${manualStatusCount}`);
}

checkHiddenAssignments().catch(console.error);
