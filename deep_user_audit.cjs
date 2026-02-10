const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const email = "princyrani303@gmail.com";

async function deepUserAudit() {
    console.log(`🔍 DEEP USER AUDIT: ${email}`);

    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (error) {
        console.error(error);
        return;
    }

    console.log('--- USER DATA ---');
    console.log(user);

    // Filter leads today for this user from the leads table
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const { count: leadsTodayCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id)
        .gte('created_at', startOfToday.toISOString());

    console.log('\n--- REAL-TIME LEAD CHECK ---');
    console.log(`Leads Today (from Leads table): ${leadsTodayCount}`);
    console.log(`Leads Today (from User counter): ${user.leads_today}`);
}

deepUserAudit();
