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
        console.log('--- CHECKING PAYMENTS TABLE ---');
        const { data: payments, error: pError } = await s.from('payments')
            .select('*')
            .in('payer_email', emails);

        if (pError) {
            console.error('Error fetching payments:', pError.message);
        } else {
            console.log('Payments Found:', JSON.stringify(payments, null, 2));
        }

        // Also check if any are linked by user_id
        const { data: users } = await s.from('users').select('id, email').in('email', emails);
        const userIds = users.filter(u => u.id).map(u => u.id);

        const { data: p2, error: p2Error } = await s.from('payments')
            .select('*')
            .in('user_id', userIds);

        if (p2Error) {
            console.error('Error fetching payments by ID:', p2Error.message);
        } else {
            console.log('Payments by ID Found:', JSON.stringify(p2, null, 2));
        }

    } catch (e) {
        console.error('Fatal error:', e);
    }
})();
