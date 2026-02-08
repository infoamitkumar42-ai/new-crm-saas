
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function auditAkash() {
    console.log("🕵️‍♂️ Deep Audit for: Akash (dbrar8826@gmail.com)...");

    // 1. Get User Data
    const { data: user } = await supabase.from('users')
        .select('*')
        .eq('email', 'dbrar8826@gmail.com')
        .single();

    if (!user) { console.log("User not found."); return; }

    console.log(`\n👤 User Profile:`);
    console.log(`- Created At: ${user.created_at}`);
    console.log(`- Current Valid Until: ${user.valid_until}`);
    console.log(`- Last Active At: ${user.last_active_at}`);

    // 2. Check Payments
    const { data: payments } = await supabase.from('payments')
        .select('*')
        .eq('user_email', 'dbrar8826@gmail.com')
        .order('created_at', { ascending: true });

    console.log(`\n💰 Payment History (${payments?.length || 0}):`);
    if (payments && payments.length > 0) {
        payments.forEach(p => {
            console.log(`- ₹${p.amount} on ${new Date(p.created_at).toLocaleString()} (Status: ${p.status})`);
        });
    } else {
        console.log("⚠️ NO PAYMENTS FOUND.");
    }

    // 3. Count Lifetime Leads
    // Since we don't track historical assignments easily in 'users' table (leads_today resets), 
    // we query LEADS table directly.
    const { count, error } = await supabase.from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_to', user.id);

    console.log(`\n📈 Total Leads Received (Lifetime): ${count}`);

    // 4. Analysis
    const limit = 55; // As per user statement
    if (count >= limit) {
        console.log(`\n🔴 RESULT: QUOTA EXCEEDED. Should be STOPPED.`);
    } else {
        console.log(`\n🟢 RESULT: QUOTA REMAINING (${limit - count}). Should be ACTIVE.`);
    }
}

auditAkash();
