const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

const auditEmails = [
    'nitinanku628@gmail.com',
    'shekhbharatbhai162@gmail.com',
    'kulwantsinghdhaliwalsaab668@gmail.com',
    'ankita.k2104@gmail.com',
    'arshkaur6395@gmail.com',
    'sumansumankaur09@gmail.com',
    'mandeep.k21@icloud.com',
    's73481109@gmail.com'
];

(async () => {
    console.log('=== 📝 DETAILED PAYMENT REPORT FOR 8 FIXED USERS ===');

    for (const email of auditEmails) {
        // Get User ID
        const { data: userData } = await supabase
            .from('users')
            .select('id, name, total_leads_promised')
            .eq('email', email)
            .single();

        if (!userData) continue;

        console.log(`\n👤 User: ${userData.name} (${email})`);
        console.log(`   Current Quota (After Fix): ${userData.total_leads_promised}`);

        // Get Payments
        const { data: payments } = await supabase
            .from('payments')
            .select('amount, plan_name, created_at, status')
            .eq('user_id', userData.id)
            .eq('status', 'captured')
            .order('created_at', { ascending: true });

        let totalExpected = 0;
        if (payments && payments.length > 0) {
            console.log('   --- Payment History ---');
            payments.forEach((p, index) => {
                const amt = Math.round(p.amount);
                let limit = 0;
                // Simplified Logic mirroring the audit script
                if (p.plan_name?.includes('starter')) limit = 50;
                else if (p.plan_name?.includes('supervisor')) limit = 105;
                else if (p.plan_name?.includes('manager')) limit = 160;
                else if (p.plan_name?.includes('weekly')) limit = 84;
                else if (p.plan_name?.includes('turbo')) limit = 98;

                if (limit === 0) {
                    if (amt >= 990 && amt <= 1000) limit = 50;
                    else if (amt >= 1990 && amt <= 2000) limit = 105;
                    else if (amt >= 2990 && amt <= 3000) limit = 160;
                    else if (amt >= 2490 && amt <= 2500) limit = 98;
                    else if (amt >= 4490) limit = 160;
                }

                totalExpected += limit;
                console.log(`   ${index + 1}. Date: ${new Date(p.created_at).toLocaleDateString()} | Amount: ₹${amt} | Plan: ${p.plan_name || 'N/A'} | Expected Leads: +${limit}`);
            });
            console.log(`   -----------------------`);
            console.log(`   TOTAL CALCULATED FROM PAYMENTS: ${totalExpected}`);
        } else {
            console.log('   (No Payments Found)');
        }
    }
})();
