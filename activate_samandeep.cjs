const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log('=== ACTIVATING SAMANDEEP ===');
    const email = 'samandeepkaur1216@gmail.com';
    const LEADS_TO_ADD = 90; // Weekly Boost

    // 1. Fetch Current
    const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
    if (!user) { console.error('User not found'); return; }

    const newPromised = (user.total_leads_promised || 0) + LEADS_TO_ADD;

    console.log(`Current Promised: ${user.total_leads_promised}`);
    console.log(`New Promised: ${newPromised} (+${LEADS_TO_ADD})`);

    // 2. Update
    const { error } = await supabase
        .from('users')
        .update({
            total_leads_promised: newPromised,
            is_active: true,
            is_online: true, // Force online as per user request
            valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Ensure validity
            daily_limit: 12,
            plan_name: 'weekly_boost'
        })
        .eq('email', email);

    if (error) console.error('❌ Failed:', error.message);
    else console.log('✅ Success! User updated.');
})();
