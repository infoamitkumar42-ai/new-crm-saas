const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log('=== FIXING GURDEEP ===');
    const email = 'gurdeepgill613@gmail.com';
    const LEADS_TO_ADD = 55; // Starter Plan

    // 1. Fetch Current
    const { data: user } = await supabase.from('users').select('*').eq('email', email).single();

    const newPromised = (user.total_leads_promised || 0) + LEADS_TO_ADD;

    console.log(`Current Promised: ${user.total_leads_promised}`);
    console.log(`Adding: ${LEADS_TO_ADD}`);
    console.log(`New Promised: ${newPromised}`);

    // 2. Update
    const { error } = await supabase
        .from('users')
        .update({
            total_leads_promised: newPromised,
            is_active: true,
            is_online: true,
            daily_limit: 5 // Ensure limit is correct
        })
        .eq('email', email);

    if (error) console.error('❌ Failed:', error.message);
    else console.log('✅ Success! Gurdeep updated.');
})();
