const { createClient } = require('@supabase/supabase-js');

// HARDCODED CREDENTIALS
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const email = 'ajayk783382@gmail.com';

async function fixAjay() {
    console.log(`🛠️ APPLYING FIX FOR USER: ${email}\n`);

    // 1. Get User
    const { data: user } = await supabase.from('users').select('id, name').eq('email', email).single();
    if (!user) {
        console.log('❌ User not found');
        return;
    }

    // 2. Apply Updates
    // Weekly Boost limit per payment is 92. Total for 3 payments = 276.
    // Setting daily_limit to 12 as per our turbo/standard restoration logic.
    const { error } = await supabase.from('users').update({
        total_leads_promised: 276,
        is_plan_pending: false,
        is_active: true,
        daily_limit: 12,
        payment_status: 'active'
    }).eq('id', user.id);

    if (error) {
        console.error('❌ Error updating user:', error);
    } else {
        console.log(`✅ SUCCESSFULLY UPDATED: ${user.name}`);
        console.log(`   - total_leads_promised: 276`);
        console.log(`   - is_plan_pending: false`);
        console.log(`   - daily_limit: 12`);
        console.log(`   - is_active: true`);
    }
}

fixAjay();
