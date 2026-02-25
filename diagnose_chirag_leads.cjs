const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const EMAILS = [
    'akshaykapadiya33@gmail.com',
    'milansolanki9176@gmail.com'
];

async function diagnoseChiragTeam() {
    console.log("🔍 DIAGNOSING CHIRAG'S TEAM MEMBERS...");

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
        console.log(`🛡️ Team Code: ${user.team_code}`);
        console.log(`🟢 Active: ${user.is_active} | 📱 Online: ${user.is_online}`);
        console.log(`📊 Plan: ${user.plan_name} | 📉 Daily Limit: ${user.daily_limit}`);
        console.log(`🔢 Total Received: ${user.total_leads_received}`);

        // Check today's leads
        const today = new Date().toISOString().split('T')[0];
        const { count: todayCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', user.id)
            .gte('assigned_at', today);

        console.log(`📅 Leads Today: ${todayCount || 0}`);

        // Check if there are any errors in leads table for them
        const { data: statusStats } = await supabase
            .from('leads')
            .select('status')
            .eq('assigned_to', user.id)
            .gte('assigned_at', today);

        if (statusStats && statusStats.length > 0) {
            const counts = statusStats.reduce((acc, l) => {
                acc[l.status] = (acc[l.status] || 0) + 1;
                return acc;
            }, {});
            console.log(`📈 Today's Status Breakdown:`, counts);
        }

        // Check Quota
        const planLimit = { 'starter': 55, 'supervisor': 115, 'manager': 500, 'weekly_boost': 150, 'turbo_boost': 500 }[user.plan_name] || 50;
        const { data: payments } = await supabase.from('payments').select('id').eq('user_id', user.id).eq('status', 'captured');
        const totalQuota = planLimit * (payments?.length || 1);

        console.log(`🏁 Quota Status: ${user.total_leads_received} / ${totalQuota}`);
        if (user.total_leads_received >= totalQuota) {
            console.log(`⚠️ WARNING: Quota reached!`);
        }
    }

    // Check Chirag's Team Status
    console.log(`\n🛡️ TEAM STATUS CHECK (CHIRAG)...`);
    const { data: teamMembers } = await supabase
        .from('users')
        .select('name, is_online, is_active, daily_limit')
        .eq('team_code', 'CHIRAG') // Assuming team code is CHIRAG, double check if it's different
        .eq('is_active', true);

    if (teamMembers) {
        console.log(`👥 Total Active in Team: ${teamMembers.length}`);
        console.log(`📱 Online Now: ${teamMembers.filter(m => m.is_online).length}`);
    }
}

diagnoseChiragTeam();
