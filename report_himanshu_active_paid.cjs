const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function reportHimanshuTeam() {
    console.log("📊 GENERATING REPORT: HIMANSHU'S ACTIVE & PAID TEAM MEMBERS");

    // 1. Fetch ALL Users in TEAMHIMANSHU
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, total_leads_received, plan_name, is_active, created_at')
        .eq('team_code', 'TEAMFIRE')
        .order('name');

    if (error) { console.error("Error fetching users:", error); return; }

    console.log(`🔍 Found ${users.length} users in TEAMHIMANSHU.`);
    console.log("----------------------------------------------------------------------------------------------------------------");
    console.log("| Name                 | Email                          | Status   | Leads | Total Paid (Real) |");
    console.log("----------------------------------------------------------------------------------------------------------------");

    let count = 0;

    for (const user of users) {
        // 2. Check Payments Table
        const { data: payments } = await supabase
            .from('payments')
            .select('amount, status')
            .eq('user_id', user.id)
            .or('status.eq.captured,status.eq.success,status.eq.paid');

        // Calculate total paid
        const totalPaid = (payments || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

        const status = user.is_active ? "✅ ACTIVE" : "❌ STOPPED";

        console.log(`| ${user.name.padEnd(20)} | ${user.email.padEnd(30)} | ${status.padEnd(8)} | ${String(user.total_leads_received).padEnd(5)} | ₹${totalPaid}             |`);

        if (totalPaid > 0 && user.is_active) count++;
    }
    console.log("----------------------------------------------------------------------------------------------------------------");
    console.log(`✅ Active & Paid Users Count: ${count}`);
}

reportHimanshuTeam();
