
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkStatus() {
    console.log("🕵️‍♂️ Checking User Status (Limits vs Used)...");

    const { data: users } = await supabase
        .from('users')
        .select('name, team_code, leads_today, daily_limit, is_active, is_online')
        .eq('is_active', true)
        .order('leads_today', { ascending: false });

    console.table(users.slice(0, 30));
}

checkStatus();
