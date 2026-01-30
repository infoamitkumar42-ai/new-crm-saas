const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkHealth() {
    console.log('Checking for stuck users (Active but 0 Limit)...');

    // Find active users who have 0 daily limit
    // This happens if 'valid_until' expired but 'is_active' wasn't toggled off correctly,
    // or if they were stopped prematurely.
    const { data: stuck } = await supabase.from('users')
        .select('id, name, email, daily_limit, valid_until, is_active, payment_status, plan_name')
        .eq('is_active', true)
        .lt('daily_limit', 1);

    if (stuck && stuck.length > 0) {
        console.log(`Found ${stuck.length} Active Users with 0 Limit:`);
        stuck.forEach(u => {
            console.log(`- ${u.name} (${u.email})`);
            console.log(`  Plan: ${u.plan_name}, Valid: ${u.valid_until}`);
        });
    } else {
        console.log('✅ All active users have daily limits > 0.');
    }
}

checkHealth();
