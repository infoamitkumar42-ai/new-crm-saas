const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const email = "princyrani303@gmail.com";

async function finalCheck() {
    const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
    if (!user) return;

    // Count physical leads
    const { count: physicalLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .or(`user_id.eq.${user.id},assigned_to.eq.${user.id}`);

    console.log(`--- FINAL DATA FOR PRINCY ---`);
    console.log(`Plan Name: ${user.plan_name}`);
    console.log(`Promised Leads: ${user.total_leads_promised}`);
    console.log(`Received Leads (Counter): ${user.total_leads_received}`);
    console.log(`Received Leads (Physical): ${physicalLeads}`);
    console.log(`Payment Status: Active (Last paid Feb 5)`);
    console.log(`Is Online: ${user.is_online}`);

    if (physicalLeads >= user.total_leads_promised) {
        console.log(`RESULT: Quota Finished. 100% Leads delivered.`);
    } else {
        console.log(`RESULT: Quota Remaining.`);
    }
}

finalCheck();
