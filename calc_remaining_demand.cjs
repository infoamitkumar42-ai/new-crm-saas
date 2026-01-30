const { createClient } = require('@supabase/supabase-js');

// HARDCODED CREDENTIALS
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function calculateRequired() {
    console.log('📊 CALCULATING REMAINING DEMAND (Today)...');

    // 1. Get ALL Active Users
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, daily_limit, leads_today')
        .eq('is_active', true)
        .gt('daily_limit', 0); // Only users who can receive leads

    if (error) { console.error(error); return; }

    let totalPending = 0;
    let pendingUsers = 0;

    console.log('\n--- Details ---');
    for (const u of users) {
        // Safe check for null
        const limit = u.daily_limit || 0;
        const current = u.leads_today || 0;
        const needed = Math.max(0, limit - current);

        if (needed > 0) {
            console.log(`- ${u.name}: Needs ${needed} more (Limit: ${limit}, Has: ${current})`);
            totalPending += needed;
            pendingUsers++;
        }
    }

    console.log('\n=======================================');
    console.log(`👥 Users Pending: ${pendingUsers}`);
    console.log(`📉 TOTAL LEADS NEEDED: ${totalPending}`);
    console.log('=======================================');
}

calculateRequired();
