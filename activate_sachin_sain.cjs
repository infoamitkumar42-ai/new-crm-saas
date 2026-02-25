const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const USER_EMAIL = 'sainsachin737@gmail.com';
const USER_ID = '0e3b5d84-cf0d-4cc3-9237-3e6e42cbdfdd';

async function activateSwati() {
    console.log(`🚀 ACTIVATING SWATI (${USER_EMAIL})...`);

    const { data, error } = await supabase
        .from('users')
        .update({
            is_active: true,
            plan_name: 'supervisor',
            daily_limit: 7, // Standard limit for Supervisor
            team_code: 'TEAMFIRE'
        })
        .eq('id', USER_ID);

    if (error) {
        console.error("❌ Error activating user:", error);
    } else {
        console.log(`✅ Swati successfully activated on Supervisor plan!`);
    }
}

activateSwati();
