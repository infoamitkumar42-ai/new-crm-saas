const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

const userPhones = [
    '9829227495', '9811430444', '8427852752', '7977132459', '8770687117',
    '8557823861', '6263553617', '7889518862', '7973464065', '7708254027'
];

(async () => {
    console.log('--- 🔎 DEEP DIVE: TRACING STATUS FOR 10 LEADS ---');

    for (const phone of userPhones) {
        console.log(`\nPhone: ${phone}`);
        const { data, error } = await supabase
            .from('leads')
            .select('id, name, status, assigned_to, created_at, users!leads_assigned_to_fkey(name)')
            .ilike('phone', `%${phone}%`);

        if (error) {
            console.error(`Error for ${phone}:`, error);
            continue;
        }

        if (data.length === 0) {
            console.log(' - NOT FOUND');
        } else {
            data.forEach(l => {
                console.log(` - ID: ${l.id} | Status: ${l.status.padEnd(15)} | Assigned To: ${(l.users?.name || 'NONE').padEnd(15)} | Created: ${l.created_at}`);
            });
        }
    }
})();
