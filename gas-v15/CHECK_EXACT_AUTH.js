import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkSpecificEmail() {
    const emailToCheck = 'mandeepkau340@gmail.com';
    console.log(`🔍 Searching for exact email: ${emailToCheck}...`);

    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    const exactMatch = users.find(u => u.email.toLowerCase() === emailToCheck.toLowerCase());

    if (exactMatch) {
        console.log(`✅ Found exact match: ${exactMatch.id}`);
    } else {
        console.log(`❌ Exact match NOT found.`);
        console.log(`📝 Showing first 5 users in Auth for context:`);
        users.slice(0, 5).forEach(u => console.log(`- ${u.email}`));
    }
}

checkSpecificEmail();
