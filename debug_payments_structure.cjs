
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function debugPayments() {
    console.log("🕵️‍♂️ RAW_PAYMENT_DEBUG: Fetching last 20 payments...");

    const { data: payments } = await supabase.from('payments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

    if (payments && payments.length > 0) {
        console.log(`✅ FOUND ${payments.length} Recent Payments.`);
        console.log("Sample Data Structure (First Record):");
        console.log(JSON.stringify(payments[0], null, 2));

        console.log("\n📋 Table View (Last 10):");
        console.table(payments.slice(0, 10).map(p => ({
            Amount: p.amount,
            User_Email: p.user_email,
            Payer_Email: p.payer_email,  // Check if this column exists/used
            User_Phone: p.user_phone,
            User_ID: p.user_id,
            Status: p.status,
            Date: new Date(p.created_at).toLocaleDateString()
        })));
    } else {
        console.log("❌ NO PAYMENTS FOUND IN DB.");
    }
}

debugPayments();
