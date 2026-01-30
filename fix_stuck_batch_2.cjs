const { createClient } = require('@supabase/supabase-js');

// HARDCODED CREDENTIALS
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PLAN_LIMITS = {
    'starter': 55,
    'supervisor': 115,
    'manager': 176,
    'weekly_boost': 92,
    'turbo_boost': 108
};

const TARGET_USERS = [
    'Divya Malik', 'Harpreet Kaur', 'Navjot kaur', 'Ruchi', 'Kirandeep kaur', 'Gurpreet kaur', 'Kiran Brar'
];

async function fixBatch() {
    console.log(`Fixing ${TARGET_USERS.length} Stuck 1-Pay Users...`);

    // Fetch IDs
    const { data: users } = await supabase.from('users').select('id, name, email, plan_name').in('name', TARGET_USERS);

    for (const u of users) {
        console.log(`- Reactivating: ${u.name} (${u.email})`);

        let defaultLimit = 5;
        if (u.plan_name.includes('weekly')) defaultLimit = 8;
        if (u.plan_name.includes('manager')) defaultLimit = 8;

        await supabase.from('users').update({
            is_active: true,
            daily_limit: defaultLimit,
            payment_status: 'active',
            valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }).eq('id', u.id);
    }
    console.log('✅ Done.');
}

fixBatch();
