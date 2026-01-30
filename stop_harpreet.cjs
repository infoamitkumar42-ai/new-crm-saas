const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function stopHarpreet() {
    console.log('🛑 STOPPING PLAN FOR Harpreet Kaur...');

    // 1. Find User
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .ilike('name', '%Harpreet Kaur%');

    if (!users || users.length === 0) { console.log('❌ User not found'); return; }

    const user = users[0];
    console.log(`👤 Found: ${user.name} (ID: ${user.id})`);
    console.log(`   - Current Status: ${user.is_active ? '✅ Active' : '❌ Inactive'}`);
    console.log(`   - Leads Today: ${user.leads_today}`);

    // 2. Deactivate
    const { error: upErr } = await supabase
        .from('users')
        .update({
            is_active: false,
            daily_limit: 0
        })
        .eq('id', user.id);

    if (upErr) {
        console.error('❌ Failed to update:', upErr);
    } else {
        console.log(`✅ SUCCESS: Harpreet Kaur has been DEACTIVATED.`);
        console.log(`   - is_active set to FALSE`);
        console.log(`   - daily_limit set to 0`);
    }
}

stopHarpreet();
