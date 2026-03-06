const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log('--- STRICT TEAM CODE AUDIT ---');

    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, team_code, is_active')
        .eq('is_active', true)
        .or('team_code.eq.GJ01TEAMFIRE,team_code.eq.TEAMFIRE');

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Found ${users.length} members with STRICT team codes (GJ01TEAMFIRE or TEAMFIRE).`);
    users.forEach(u => console.log(`- ${u.name} (${u.email}) [Team: ${u.team_code}]`));

    // Check specific users mentioned
    const suspicious = ['bhumitpatel.0764@gmail.com', 'kaushalrathod2113@gmail.com', 'akshaykapadiya33@gmail.com'];
    const { data: wrongUsers } = await supabase
        .from('users')
        .select('id, name, email, team_code')
        .in('email', suspicious);

    console.log('\n--- VERIFYING WRONG USERS ---');
    wrongUsers.forEach(u => console.log(`- ${u.name} (${u.email}) [Team: ${u.team_code}]`));
}

check();
