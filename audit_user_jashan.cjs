const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const email = "Jashanpreet0479@gmail.com";

async function auditUser() {
    console.log(`🔍 AUDIT FOR: ${email}`);

    // 1. Fetch User Profile
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .ilike('email', email) // Case-insensitive search
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
    console.log(`   - Is Online: ${user.is_online}`);
    console.log(`   - Created At: ${user.created_at}`);

    // 2. Fetch Payments
    const { data: payments, error: payError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    console.log(`\n💳 PAYMENT HISTORY:`);
    if (payments && payments.length > 0) {
        payments.forEach(p => {
            console.log(`   - ${new Date(p.created_at).toLocaleDateString()} | ${p.amount / 100} INR | Status: ${p.status} | Plan: ${p.plan_name}`);
        });
    } else {
        console.log("   - No payments found.");
    }

    // 3. Fetch Lead Count
    const { count: totalLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .or(`user_id.eq.${user.id},assigned_to.eq.${user.id}`);

    console.log(`\n📈 TOTAL LEADS RECEIVED: ${totalLeads || 0}`);

    // 4. Check for blocking issues
    console.log(`\n🛠️ DIAGNOSIS:`);
    if (!user.is_active) console.log("   - ❌ User is DEACTIVATED (is_active = false)");
    if (!user.is_online) console.log("   - ⚠️ User is OFFLINE (is_online = false)");
    if (!user.team_code) console.log("   - ❌ User has NO team_code (leads won't route)");

    // Check if team is managed and active
    if (user.team_code) {
        const { data: manager } = await supabase.from('users').select('name').eq('team_code', user.team_code).eq('role', 'manager').maybeSingle();
        console.log(`   - Team: ${user.team_code} (${manager ? 'Manager: ' + manager.name : 'No Manager Found'})`);
    }

    // Recent leads
    const { data: recentLeads } = await supabase
        .from('leads')
        .select('name, created_at')
        .or(`user_id.eq.${user.id},assigned_to.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(3);

    if (recentLeads && recentLeads.length > 0) {
        console.log(`\n🕒 RECENT LEADS:`);
        recentLeads.forEach(l => console.log(`   - ${l.name} | ${new Date(l.created_at).toLocaleString()}`));
    }
}

auditUser();
