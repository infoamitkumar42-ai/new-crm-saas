
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkNewActivations() {
    console.log("🔥 HIMANSHU TEAM: NEW ACTIVATIONS REPORT (Last 48 Hours)...\n");

    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const dateStr = twoDaysAgo.toISOString();

    // 1. Fetch Users who ACTIVATED a plan recently (or Created account recently)
    const { data: users } = await supabase.from('users')
        .select('name, email, plan_name, daily_limit, created_at, plan_activation_time')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', true)
        .or(`created_at.gte.${dateStr},plan_activation_time.gte.${dateStr}`)
        .order('plan_activation_time', { ascending: false });

    if (!users || users.length === 0) return console.log("No new activations found in last 48 hours.");

    const freshUsers = users.filter(u => new Date(u.created_at) >= twoDaysAgo);
    const renewedUsers = users.filter(u => new Date(u.created_at) < twoDaysAgo);

    console.log(`📊 TOTAL ACTIVE MOVERS: ${users.length} (In last 2 days)`);
    console.log(`--------------------------------------------------`);

    console.log(`\n🆕 BRAND NEW JOINEES (${freshUsers.length}):`);
    if (freshUsers.length > 0) {
        console.table(freshUsers.map(u => ({
            Name: u.name,
            Plan: u.plan_name,
            Limit: u.daily_limit,
            Joined: new Date(u.created_at).toLocaleDateString()
        })));
    } else {
        console.log("   No new signups.");
    }

    console.log(`\n🔄 RENEWALS / UPGRADES (${renewedUsers.length}):`);
    if (renewedUsers.length > 0) {
        console.table(renewedUsers.map(u => ({
            Name: u.name,
            Plan: u.plan_name,
            Limit: u.daily_limit,
            Activated: new Date(u.plan_activation_time).toLocaleDateString()
        })));
    } else {
        console.log("   No recent renewals.");
    }
}

checkNewActivations();
