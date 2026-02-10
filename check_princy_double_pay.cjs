const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const email = "princyrani303@gmail.com";

async function checkDoublePayment() {
    console.log(`🔍 Checking Payments for: ${email}`);

    // 1. Get User
    const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
    if (!user) {
        console.log("User not found.");
        return;
    }

    // 2. Get ALL captured payments
    const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'captured');

    console.log(`\nCaptured Payments Found: ${payments?.length || 0}`);
    if (payments) {
        payments.forEach(p => {
            console.log(`- Date: ${new Date(p.created_at).toLocaleString()} | Amount: ${p.amount} | Plan: ${p.plan_name}`);
        });
    }

    console.log(`\nCurrent User Stats:`);
    console.log(`- Promised Leads (DB): ${user.total_leads_promised}`);
    console.log(`- Received Leads (Counter): ${user.total_leads_received}`);

    // Calculate expected limit (Turbo Boost = 115 per payment)
    const expectedLimit = (payments?.length || 1) * 115;
    console.log(`\nCalculated Expected Limit: ${expectedLimit}`);

    if (expectedLimit > user.total_leads_promised) {
        console.log(`🚀 Quota needs update: ${user.total_leads_promised} -> ${expectedLimit}`);
    } else {
        console.log(`✅ Quota is already up to date or higher.`);
    }
}

checkDoublePayment();
