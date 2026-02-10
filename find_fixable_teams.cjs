const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function findFixableUsers() {
    const { data: users, error } = await supabase
        .from('users')
        .select('name, email, manager_id, team_code')
        .is('team_code', null)
        .not('manager_id', 'is', null);

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Found ${users.length} users with Manager but NO team_code:`);
    for (const user of users) {
        const { data: manager } = await supabase.from('users').select('name, team_code').eq('id', user.manager_id).single();
        console.log(`- ${user.name} (${user.email}) | Manager: ${manager?.name} | Proposed Team: ${manager?.team_code}`);
    }
}

findFixableUsers();
