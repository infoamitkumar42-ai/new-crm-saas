const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkTopOwners() {
    const ownerIds = [
        '3a55235b-29cb-4438-b06c-ec4e8839f0df', // Gurpreet
        'c12e1335-33c0-4e00-b1c6-413da14ac421', // Nitin
        'f7022153-3a7e-42b7-8b1b-e307bb9767f2', // Rajinder
        'ddae3b82-07a6-4c54-9ee6-9d374be2a722', // Prince
        'be4791c0-3dd4-44c0-9771-600a766bdd5a', // Mandeep
        'b129f663-cb4f-45a0-999b-1b98a5e187e2'  // SAMAN
    ];

    const { data: users } = await supabase.from('users').select('name, email, role').in('id', ownerIds);
    console.log('Top Owners Roles:', users);
}
checkTopOwners();
