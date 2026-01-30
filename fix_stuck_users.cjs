const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TO_FIX = [
    'ruchitanwar2004@gmail.com',
    'kirandeepkaur7744@gmail.com',
    'bhawna1330@gmail.com'
];

async function fixStuckUsers() {
    console.log('Fixing 3 Stuck Users...');

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5); // Extend 5 days

    for (const email of TO_FIX) {
        const { error } = await supabase.from('users').update({
            daily_limit: 5, // Starter Plan Default
            valid_until: futureDate.toISOString(),
            // Ensure Active
            is_active: true,
            payment_status: 'active'
        }).eq('email', email);

        if (!error) console.log(`✅ Fixed: ${email}`);
        else console.log(`❌ Error ${email}:`, error);
    }
}

fixStuckUsers();
