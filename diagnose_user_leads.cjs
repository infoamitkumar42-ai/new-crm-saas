const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function diagnoseUser(email) {
    console.log(`🔍 Diagnosing User: ${email}...`);

    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .ilike('email', email)
        .single();

    if (error) {
        console.error("❌ Error fetching user:", error.message);
        return;
    }

    if (!user) {
        console.error("❌ User not found in public.users");
        return;
    }

    console.log("\n👤 PROFILE DATA:");
    console.log(`- ID: ${user.id}`);
    console.log(`- Name: ${user.name}`);
    console.log(`- Role: ${user.role}`);
    console.log(`- Status: ${user.is_active ? '✅ ACTIVE' : '❌ INACTIVE'}`);
    console.log(`- Online: ${user.is_online ? '✅ ONLINE' : '❌ OFFLINE'}`);
    console.log(`- Last Activity: ${user.last_activity}`);

    console.log("\n📊 PLAN & QUOTA:");
    console.log(`- Plan: ${user.plan_name}`);
    console.log(`- Payment: ${user.payment_status}`);
    console.log(`- Valid Until: ${user.valid_until}`);
    console.log(`- Daily Limit: ${user.daily_limit}`);
    console.log(`- Leads Today: ${user.leads_today}`);
    console.log(`- Total Received: ${user.total_leads_received}`);
    console.log(`- Total Promised: ${user.total_leads_promised}`);

    console.log("\n🕒 ROTATION:");
    console.log(`- Last Assigned At: ${user.last_assigned_at}`);

    // Check if leads were recently assigned to them but not showing?
    const { count: leadCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id);

    console.log(`\n📈 ACTUAL LEADS IN DB: ${leadCount}`);

    // Evaluation
    console.log("\n📝 EVALUATION:");
    if (!user.is_active) console.log("⚠️ PROBLEM: User is marked as INACTIVE (is_active=false)");
    if (!user.is_online) console.log("⚠️ PROBLEM: User is marked as OFFLINE (is_online=false). They must toggle the play button in dashboard!");
    if (user.payment_status !== 'active') console.log("⚠️ PROBLEM: Payment status is not 'active'");
    if (new Date(user.valid_until) < new Date()) console.log("⚠️ PROBLEM: Plan has EXPIRED");
    if (user.leads_today >= user.daily_limit) console.log("⚠️ PROBLEM: Daily limit reached");

    if (user.is_active && user.is_online && user.payment_status === 'active' && user.leads_today < user.daily_limit) {
        console.log("✅ CONFIG OK: System should be giving leads. Checking team context...");

        // Check if there are other users in the same team with fewer leads today
        const { data: teamUsers } = await supabase
            .from('users')
            .select('name, leads_today, last_assigned_at')
            .eq('manager_id', user.manager_id)
            .eq('is_active', true)
            .eq('is_online', true)
            .order('leads_today', { ascending: true });

        console.log("\n👥 TEAM STATUS (Active/Online):");
        teamUsers.forEach(u => console.log(`- ${u.name.padEnd(20)} | Leads Today: ${u.leads_today} | Last: ${u.last_assigned_at}`));
    }
}

const targetEmail = process.argv[2] || 'sonalben0099@gmail.com';
diagnoseUser(targetEmail);
