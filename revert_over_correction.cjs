const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log('=== 📉 REVERTING OVER-CORRECTED QUOTAS (Fake Manager Fix) ===');

    // List of users to revert
    const reverts = [
        { email: 'arshkaur6395@gmail.com', correctQuota: 150 }, // Was 260
        { email: 'sunnymehre451@gmail.com', correctQuota: 50 },  // Was 1000!
        { email: 'rathoddevanshi774@gmail.com', correctQuota: 98 }, // Was 108
        { email: 'jerryvibes.444@gmail.com', correctQuota: 105 }, // Was 115
        { email: 'ravenjeetkaur@gmail.com', correctQuota: 168 }  // Was 200
    ];

    for (const r of reverts) {
        const { data: user } = await supabase.from('users').select('id, total_leads_promised, name').eq('email', r.email).single();

        if (user && user.total_leads_promised > r.correctQuota) {
            console.log(`📉 REVERTING: ${user.name} (${r.email})`);
            console.log(`   Current: ${user.total_leads_promised} -> Target: ${r.correctQuota}`);

            const { error } = await supabase
                .from('users')
                .update({ total_leads_promised: r.correctQuota })
                .eq('id', user.id);

            if (!error) console.log('   ✅ Fixed.');
            else console.error('   ❌ Failed:', error.message);
        } else {
            console.log(`✅ ${r.email} is already correct or below target (${user?.total_leads_promised || 'N/A'}).`);
        }
    }

    console.log('Done.');
})();
