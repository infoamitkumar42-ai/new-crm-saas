import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkId() {
    const idToCheck = '472a9866-4773-46bb-9549-3e4aceabba25';
    console.log(`🔍 Searching for exact ID in Auth: ${idToCheck}...`);

    const { data: { user }, error } = await supabase.auth.admin.getUserById(idToCheck);

    if (error) {
        console.error('❌ Error:', error.message);
    } else if (user) {
        console.log(`✅ Found user in Auth! Email: ${user.email}`);
    } else {
        console.log(`❌ User ID NOT found in Auth system.`);
    }
}

checkId();
