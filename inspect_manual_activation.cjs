const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const EMAILS = [
    'princyrani303@gmail.com'
];

async function inspectUsers() {
    console.log("🔍 INSPECTING USERS FOR ACTIVATION...");

    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .in('email', EMAILS);

    if (error) {
        console.error("❌ Error fetching users:", error);
        return;
    }

    if (!users || users.length === 0) {
        console.log("❌ No users found!");
        return;
    }

    for (const user of users) {
        console.log(`\n---------------------------------------------------`);
        console.log(`👤 User: ${user.name} (${user.email})`);
        console.log(`🆔 ID: ${user.id}`);
        console.log(`🛡️ Team: ${user.team_code}`);
        console.log(`📅 Created: ${new Date(user.created_at).toLocaleDateString()}`);
        console.log(`📊 Current Plan: ${user.plan_name}`);
        console.log(`🔢 Leads Received: ${user.total_leads_received}`);
        console.log(`📉 Daily Limit: ${user.daily_limit}`);
        console.log(`🟢 Is Active: ${user.is_active}`);

        // Fetch Payments
        const { data: payments } = await supabase
            .from('payments')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'captured')
            .order('created_at', { ascending: false });

        if (payments && payments.length > 0) {
            console.log(`💰 Valid Payments Found: ${payments.length}`);
            payments.forEach(p => {
                console.log(`   - ${new Date(p.created_at).toLocaleDateString()}: ₹${p.amount} (${p.plan_name})`);
            });
        } else {
            console.log(`⚠️ No captured payments found.`);
        }
    }
}

inspectUsers();
