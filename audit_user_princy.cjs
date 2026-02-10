const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const email = "princyrani303@gmail.com";

async function auditUser() {
    console.log(`🔍 AUDIT FOR: ${email}`);

    // 1. Fetch User Profile
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

    if (userError) {
        console.error("Error fetching user:", userError);
        return;
    }

    if (!user) {
        console.log("❌ User not found in database.");
        return;
    }

    console.log(`\n👤 PROFILE INFO:`);
    console.log(`   - Name: ${user.name}`);
    console.log(`   - Role: ${user.role}`);
    console.log(`   - Team Code: ${user.team_code}`);
    console.log(`   - Plan: ${user.plan_name}`);
    console.log(`   - Daily Limit: ${user.daily_limit}`);
    console.log(`   - Leads Today: ${user.leads_today}`);
    console.log(`   - Is Active: ${user.is_active}`);
    console.log(`   - Last Activity: ${user.last_activity}`);

    // 2. Fetch Payments
    const { data: payments, error: payError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    console.log(`\n💳 PAYMENT HISTORY:`);
    if (payments && payments.length > 0) {
        payments.forEach(p => {
            console.log(`   - ${new Date(p.created_at).toLocaleDateString()} | ${p.amount} ${p.currency} | Status: ${p.status} | ID: ${p.id}`);
        });
    } else {
        console.log("   - No payments found.");
    }

    // 3. Fetch Total Leads Count
    const { count: totalLeads, error: leadError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .or(`user_id.eq.${user.id},assigned_to.eq.${user.id}`);

    console.log(`\n📈 TOTAL LEADS RECORDED: ${totalLeads || 0}`);

    // 4. Check for Specific Issues
    console.log(`\n🛠️ ISSUES CHECK:`);
    if (!user.is_active) console.log("   - ⚠️ Account is DEACTIVATED (is_active = false)");
    if (user.leads_today >= user.daily_limit) console.log(`   - ⚠️ Daily limit reached (${user.leads_today}/${user.daily_limit})`);

    // Check if team is active
    if (user.team_code === 'TEAMFIRE') {
        console.log("   - ℹ️ Member of TEAMFIRE (Himanshu's team). Distribution is active.");
    }

    // Check last 5 leads for this user
    const { data: recentLeads } = await supabase
        .from('leads')
        .select('name, created_at')
        .or(`user_id.eq.${user.id},assigned_to.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(5);

    if (recentLeads && recentLeads.length > 0) {
        console.log(`\n🕒 RECENT LEADS:`);
        recentLeads.forEach(l => {
            console.log(`   - ${l.name} | ${new Date(l.created_at).toLocaleString()}`);
        });
    }
}

auditUser();
