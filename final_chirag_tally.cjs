const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

const TEAM = 'GJ01TEAMFIRE';
const WHITELIST = [
    'cmdarji1997@gmail.com',
    'kaushalrathod2113@gmail.com',
    'bhumitpatel.0764@gmail.com'
];

(async () => {
    console.log(`=== 📊 FINAL ACTIVE TALLY: ${TEAM} ===`);

    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, is_active, total_leads_promised, total_leads_received')
        .eq('team_code', TEAM)
        .eq('is_active', true);

    if (error) { console.error('Error:', error); return; }

    let totalActive = 0;
    let withPending = 0;
    let paidWithPending = 0;
    let manualWithPending = 0;
    let totalPendingLeads = 0;

    for (const user of users) {
        totalActive++;
        const promised = user.total_leads_promised || 0;
        const received = user.total_leads_received || 0;
        const pending = Math.max(0, promised - received);

        if (pending > 0) {
            withPending++;
            totalPendingLeads += pending;

            // Check if paid
            const { data: payments } = await supabase
                .from('payments')
                .select('id')
                .eq('user_id', user.id)
                .eq('status', 'captured')
                .limit(1);

            if (payments && payments.length > 0) {
                paidWithPending++;
            } else if (WHITELIST.includes(user.email.toLowerCase())) {
                manualWithPending++;
            }
        }
    }

    console.log(`\n--- FINAL RESULTS ---`);
    console.log(`Total Active Users: ${totalActive}`);
    console.log(`Active Users with Pending Quota: ${withPending}`);
    console.log(`   -> Paid Members: ${paidWithPending}`);
    console.log(`   -> Whitelisted Manual: ${manualWithPending}`);
    console.log(`Total Pending Leads in Team: ${totalPendingLeads}`);
    console.log(`----------------------\n`);
})();
