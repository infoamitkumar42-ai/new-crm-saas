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
        const { data: users } = await s.from('users').select('id, email, name, total_leads_promised').in('email', emails);
        const results = [];

        for (const email of emails) {
            const user = users.find(u => u.email === email);
            if (!user) {
                results.push({ email, name: 'NOT FOUND', paid: 'N/A' });
                continue;
            }

            const { data: pByEmail } = await s.from('payments').select('id, amount, status').eq('payer_email', email).eq('status', 'captured');
            const { data: pById } = await s.from('payments').select('id, amount, status').eq('user_id', user.id).eq('status', 'captured');

            const hasPayment = (pByEmail && pByEmail.length > 0) || (pById && pById.length > 0);
            results.push({
                email,
                name: user.name,
                promised: user.total_leads_promised,
                paid: hasPayment ? 'YES' : 'NO',
                payment_count: (pByEmail ? pByEmail.length : 0) + (pById ? pById.length : 0)
            });
        }

        console.table(results);

    } catch (e) {
        console.error('Fatal:', e);
    }
})();
