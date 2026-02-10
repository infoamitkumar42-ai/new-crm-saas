const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const email = "Jashanpreet0479@gmail.com";

async function deepAudit() {
    const { data: user } = await supabase.from('users').select('*').ilike('email', email).single();
    if (!user) return;

    console.log('--- JASHANPREET FULL DATA ---');
    console.log(`ID: ${user.id}`);
    console.log(`Name: ${user.name}`);
    console.log(`Manager ID: ${user.manager_id}`);
    console.log(`Team Code: ${user.team_code}`);
    console.log(`Is Online: ${user.is_online}`);
    console.log(`Is Active: ${user.is_active}`);

    if (user.manager_id) {
        const { data: manager } = await supabase.from('users').select('name, team_code').eq('id', user.manager_id).single();
        console.log(`Manager: ${manager?.name} | Manager Team Code: ${manager?.team_code}`);
    } else {
        console.log('No manager_id found for this user.');
    }
}

deepAudit();
