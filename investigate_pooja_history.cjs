const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function investigatePooja() {
    console.log("🕵️ INVESTIGATING POOJA'S HISTORY...");
    const email = 'jollypooja5@gmail.com';

    // 1. User Details
    const { data: user } = await supabase
        .from('users')
        .select('id, name, created_at, team_code')
        .eq('email', email)
        .single();

    if (!user) { console.log("User not found"); return; }

    console.log(`\n👤 User: ${user.name}`);
    console.log(`📅 Joined: ${new Date(user.created_at).toLocaleString('en-IN')}`);
    console.log(`🏢 Team: ${user.team_code}`);

    // 2. First & Last Lead
    const { data: firstLead } = await supabase
        .from('leads')
        .select('created_at')
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: true }) // Oldest first
        .limit(1);

    const { data: lastLead } = await supabase
        .from('leads')
        .select('created_at')
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false }) // Newest first
        .limit(1);

    if (firstLead && firstLead.length > 0) {
        console.log(`🏁 First Lead Received: ${new Date(firstLead[0].created_at).toLocaleString('en-IN')}`);
        console.log(`🛑 Last Lead Received:  ${new Date(lastLead[0].created_at).toLocaleString('en-IN')}`);
    } else {
        console.log("❌ No leads found.");
    }

    // 3. Payment History
    const { data: payments } = await supabase
        .from('payment_history')
        .select('*')
        .eq('user_id', user.id)
        .order('payment_date', { ascending: true }); // Oldest first

    console.log(`\n💰 PAYMENT HISTORY (${payments ? payments.length : 0} Records):`);
    if (payments && payments.length > 0) {
        payments.forEach(p => {
            console.log(`- ₹${p.amount} on ${new Date(p.payment_date).toLocaleDateString('en-IN')} (${p.plan_type}) [Status: ${p.status}]`);
        });
    } else {
        console.log("- No payment records found in 'payment_history'.");
    }

    // 4. Manual Analysis for User
    console.log("\n🤔 ANALYSIS:");
    if (payments && payments.length === 0) {
        console.log("User has received leads but has NO recorded payments. Likely added manually or paid cash.");
    } else if (payments) {
        const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        console.log(`Total Paid: ₹${totalPaid}`);
    }
}

investigatePooja();
