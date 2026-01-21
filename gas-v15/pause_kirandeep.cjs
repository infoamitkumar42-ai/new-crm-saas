
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function pauseUser() {
    const email = 'kirandeepkaur7744@gmail.com';
    console.log(`⏸️ Pausing User: ${email}...\n`);

    // Set daily_limit to 0
    const { data, error } = await supabase
        .from('users')
        .update({ daily_limit: 0 })
        .eq('email', email)
        .select();

    if (error) { console.error("Error:", error); return; }

    if (data && data.length > 0) {
        console.log(`✅ Paused: ${data[0].name}`);
        console.log(`   Email: ${email}`);
        console.log(`   New Limit: 0 (No leads today)`);
    } else {
        console.log(`❌ User not found with email: ${email}`);
    }
}

pauseUser();
