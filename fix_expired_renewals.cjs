const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log('=== FIXING/EXTENDING DBRAR & SIPREET ===');
    const users = ['dbrar8826@gmail.com', 'sipreet73@gmail.com'];

    // Extend by 7 Days from NOW
    // Or from their current expiry? 
    // Dbrar expired yesterday. Need from NOW.
    // Sipreet valid till 19th. Extend from 19th? Or just set to NOW + 10?
    // Let's set both to NOW + 7 Days for simplicity and immediate relief.

    const newDate = new Date();
    newDate.setDate(newDate.getDate() + 7);
    const validUntilISO = newDate.toISOString();

    for (const email of users) {
        console.log(`\n--- Fixing ${email} ---`);

        const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
        if (!user) continue;

        const { error } = await supabase
            .from('users')
            .update({
                valid_until: validUntilISO,
                is_active: true, // Ensure active
                is_online: true
            })
            .eq('email', email);

        if (error) console.error('❌ Failed:', error.message);
        else console.table({
            Email: email,
            OldExpiry: user.valid_until,
            NewExpiry: validUntilISO,
            Status: 'Extended 7 Days'
        });
    }
})();
