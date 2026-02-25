const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    console.log("🔍 Generating detailed report for 'nikkibaljinderkaur@gmail.com'...");

    const email = 'nikkibaljinderkaur@gmail.com';

    // 1. Get user profile
    const { data: user, error: uErr } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (uErr || !user) {
        console.error("User not found or error:", uErr?.message);
        return;
    }

    console.log(`\n--- USER PROFILE ---`);
    console.log(`ID: ${user.id}`);
    console.log(`Name: ${user.name}`);
    console.log(`Created At: ${user.created_at} (Account Age)`);
    console.log(`Plan Name: ${user.plan_name}`);
    console.log(`Plan Validity: ${user.plan_validity}`);
    console.log(`Plan Status: ${user.plan_status}`);
    console.log(`Is Active: ${user.is_active}`);
    console.log(`Total Leads Received: ${user.total_leads_received}`);
    console.log(`Total Quota: ${user.total_quota}`);

    // 2. Check Payments Table
    const { data: payments, error: pErr } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    console.log(`\n--- PAYMENT HISTORY ---`);
    if (pErr) {
        console.error("Error fetching payments:", pErr.message);
    } else if (!payments || payments.length === 0) {
        console.log("❌ No payments found in the system for this user.");
    } else {
        console.log(`Found ${payments.length} payment(s):`);
        payments.forEach(p => {
            console.log(`- ID: ${p.payment_id || p.id} | Amount: ₹${p.amount} | Status: ${p.status} | Date: ${p.created_at} | Plan: ${p.plan_name}`);
        });
    }

    // 3. Check Subscription / Plan Details if any other tables exist (like user_plans if applicable, else rely on user table)

}

main().catch(console.error);
