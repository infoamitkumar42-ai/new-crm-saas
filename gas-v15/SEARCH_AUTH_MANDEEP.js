import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function searchAuthUsers() {
    console.log(`🔍 Listing Auth users to find matches...`);

    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    console.log(`📊 Total Auth Users: ${users.length}`);

    const matches = users.filter(u =>
        u.email.toLowerCase().includes('mandeep') ||
        (u.user_metadata && u.user_metadata.name && u.user_metadata.name.toLowerCase().includes('mandeep'))
    );

    if (matches.length > 0) {
        console.log('\n✅ Potential Matches in Auth System:');
        matches.forEach(u => {
            console.log(`- Email: ${u.email} | ID: ${u.id}`);
        });
    } else {
        console.log('\n❌ No "mandeep" related users found in Auth System.');
    }
}

searchAuthUsers();
