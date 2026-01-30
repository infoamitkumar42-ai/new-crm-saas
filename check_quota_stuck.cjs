const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TARGET_EMAILS = [
    'ruchitanwar2004@gmail.com',
    'kirandeepkaur7744@gmail.com',
    'bhawna1330@gmail.com',
    'ananyakakkar53b@gmail.com' // Saloni
];

async function checkQuota() {
    console.log('Checking Quota for Expired Users...');

    for (const email of TARGET_EMAILS) {
        const { data: u } = await supabase.from('users').select('*').eq('email', email).single();
        if (!u) continue;

        // Count Actual Leads
        const { count: actual } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', u.id);

        // Quota
        // Use total_leads_promised if set, else calculate from plan
        let quota = u.total_leads_promised || 0;
        if (quota === 0) {
            if (u.plan_name?.includes('starter')) quota = 55;
            if (u.plan_name?.includes('weekly')) quota = 84; // or 92 now?
            if (u.plan_name?.includes('supervisor')) quota = 105; // or 115?
        }

        const remaining = quota - actual;

        console.log(`\nUser: ${u.name} (${u.plan_name})`);
        console.log(`- Promised: ${quota}`);
        console.log(`- Received: ${actual}`);
        console.log(`- Remaining: ${remaining}`);
        console.log(`- Status: ${u.is_active ? 'Active' : 'Inactive'}, Limit: ${u.daily_limit}`);

        if (remaining > 0 && u.daily_limit === 0) {
            console.log('⚠️ NEEDS FIX: Has Pending Quota but 0 Limit');
        }
    }
}

checkQuota();
