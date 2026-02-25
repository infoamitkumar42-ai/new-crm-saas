const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    console.log("🔍 Fetching clean payment records for Baljinder...\n");

    const email = 'nikkibaljinderkaur@gmail.com';

    const { data: user } = await supabase.from('users').select('id').eq('email', email).single();

    const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (!payments || payments.length === 0) {
        console.log("No payments found in the DB.");
    } else {
        payments.forEach(p => {
            console.log(`Payment Date: ${p.created_at} | Amount: ₹${p.amount} | Status: ${p.status} | ID: ${p.razorpay_payment_id || p.id}`);
        });
    }

    const { data: subs } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id);

    if (subs && subs.length > 0) {
        console.log("\nSubscriptions:");
        subs.forEach(s => {
            console.log(`Plan: ${s.plan_name} | Start: ${s.start_date} | End: ${s.end_date} | Status: ${s.status}`);
        });
    } else {
        console.log("\nNo subscriptions found in 'subscriptions' table.");
    }

}

main().catch(console.error);
