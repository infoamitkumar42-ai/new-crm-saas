
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function masterAudit() {
    console.log("🕵️ MASTER DATA AUDIT START...\n");
    const today = new Date().toISOString().split('T')[0];

    // 1. ADMIN STATS CHECK (Overall)
    const { count: totalLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true });
    const { count: leadsToday } = await supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', today);

    console.log(`📊 ADMIN VIEW:`);
    console.log(`   - Total Leads (DB): ${totalLeads}`);
    console.log(`   - Leads Today (DB): ${leadsToday}`);
    console.log("   -----------------------------------");

    // 2. MANAGER TEAM CHECK (Ex: Rajwinder)
    // Find Rajwinder
    const { data: manager } = await supabase.from('users').select('id, name, team_code').ilike('name', '%Rajwinder%').limit(1).single();

    if (manager) {
        // Count Leads assigned to users with this team code
        const { data: teamUsers } = await supabase.from('users').select('id').eq('team_code', manager.team_code);
        const userIds = teamUsers.map(u => u.id);

        const { count: teamLeadsTotal } = await supabase.from('leads').select('*', { count: 'exact', head: true }).in('user_id', userIds);

        console.log(`👨‍💼 MANAGER VIEW (${manager.name} - ${manager.team_code}):`);
        console.log(`   - Team Members: ${userIds.length}`);
        console.log(`   - Total Team Leads (Calculated): ${teamLeadsTotal}`);
    }

    // 3. MEMBER STATS CHECK (Random Active Member)
    const { data: member } = await supabase.from('users')
        .select('id, name, leads_all_time, leads_today')
        .eq('is_active', true)
        .gt('leads_all_time', 0)
        .limit(1)
        .single();

    if (member) {
        // Calculate Actual DB Counts
        // "My Leads" logic usually checks 'assigned_to'
        const { count: actualTotal } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .or(`user_id.eq.${member.id},assigned_to.eq.${member.id}`);

        const { count: actualToday } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .or(`user_id.eq.${member.id},assigned_to.eq.${member.id}`)
            .gte('created_at', today);

        console.log(`👤 MEMBER VIEW (${member.name}):`);
        console.log(`   - Dashboard Shows (Cached): Total=${member.leads_all_time}, Today=${member.leads_today}`);
        console.log(`   - Actual DB Count:          Total=${actualTotal}, Today=${actualToday}`);

        if (member.leads_all_time !== actualTotal || member.leads_today !== actualToday) {
            console.log("   ❌ DISCREPANCY FOUND! Dashboard cache might be lagging.");
            console.log("   --> Fix: Dashboard should trigger a re-count or use Realtime.");
        } else {
            console.log("   ✅ DATA MATCHES PERFECTLY.");
        }
    }

    console.log("\n✅ Audit Complete.");
}

masterAudit();
