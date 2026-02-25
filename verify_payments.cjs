const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://vewqzsqddgmkslnuctvb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us');

const emails = [
    'goldymahi27@gmail.com',
    'gargabhay81@gmail.com',
    'brarmandeepkaur7@gmail.com',
    'sameerchauhan010424@gmail.com',
    'fatimajodhatarfatimajodhatar@gmail.com',
    'sohanpgk22@gmail.com',
    'jadavdipika36@gmail.com',
    'techeducation.kkp@gmail.com',
    'varunsagar653@gmail.com'
];

(async () => {
    try {
        console.log('--- CHECKING MANUAL PAYMENTS ---');
        const { data: manualPayments, error: mpError } = await s.from('manual_payments')
            .select('*')
            .in('user_email', emails);

        if (mpError) {
            console.error('Error fetching manual_payments:', mpError.message);
        } else {
            console.log('Manual Payments Found:', JSON.stringify(manualPayments, null, 2));
        }

        console.log('\n--- CHECKING USER METADATA/PLANS ---');
        const { data: users, error: uError } = await s.from('users')
            .select('email, plan_name, total_leads_promised, total_leads_received, metadata')
            .in('email', emails);

        if (uError) {
            console.error('Error fetching users:', uError.message);
        } else {
            console.log('Users Data:', JSON.stringify(users, null, 2));
        }

    } catch (e) {
        console.error('Fatal error:', e);
    }
})();
