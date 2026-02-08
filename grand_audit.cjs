
const { createClient } = require('@supabase/supabase-js');

// Config
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function deepAudit() {
    console.log("🏥 STARTING GRAND SYSTEM AUDIT...\n");

    const todayStart = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';

    // 1. SYSTEM STATUS CHECK
    const { data: allUsers } = await supabase.from('users').select('id, name, is_active, is_online, plan_name, daily_limit, leads_today, team_code, created_at');
    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter(u => u.is_active).length;
    const onlineUsers = allUsers.filter(u => u.is_online).length;

    console.log(`📡 SYSTEM STATUS:`);
    console.log(`   - Total Users: ${totalUsers}`);
    console.log(`   - Active Users: ${activeUsers} (If 0, System is STOPPED)`);
    console.log(`   - Online Users: ${onlineUsers}`);

    if (activeUsers === 0) {
        console.log("   ❌ WARNING: System seems STOPPED (0 Active Users).");
    } else {
        console.log("   ✅ System is ACTIVE.");
    }
    console.log("---------------------------------------------------");

    // 2. DATA ACCURACY CHECK (UI vs DB)
    console.log("🔍 CHECKING DATA ACCURACY (User Status Bar vs Actual Leads)...\n");

    let mismatchCount = 0;
    const mismatches = [];

    // Filter only those who should have leads (Plan != none)
    const paidUsers = allUsers.filter(u => u.plan_name !== 'none');

    for (const user of paidUsers) {
        // Calculate REAL count from Leads Table
        // Logic: Count leads assigned to this user TODAY
        const { count: realCount, error } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .or(`user_id.eq.${user.id},assigned_to.eq.${user.id}`)
            .gte('created_at', todayStart);

        if (error) { console.error("Error fetching leads for", user.name); continue; }

        // Comparison
        // UI uses 'users.leads_today' column.
        // DB uses 'leads' table count.
        if (realCount !== user.leads_today) {
            mismatches.push({
                name: user.name,
                plan: user.plan_name,
                ui_shows: user.leads_today,
                actual_db: realCount,
                diff: (user.leads_today - realCount)
            });
            mismatchCount++;
        }
    }

    if (mismatchCount > 0) {
        console.log(`❌ DISCREPANCIES FOUND IN ${mismatchCount} USERS!`);
        console.log("(These users see WRONG Progress Bar data)");
        console.table(mismatches);
    } else {
        console.log("✅ ALL USERS DATA IS 100% ACCURATE. (UI matches DB)");
    }
    console.log("---------------------------------------------------");

    // 3. NEW USER PLAN CHECK
    // Check users created in last 48 hours
    const recentUsers = allUsers.filter(u => new Date(u.created_at) > new Date(Date.now() - 48 * 60 * 60 * 1000));
    console.log(`🆕 NEW USERS CHECK (${recentUsers.length} found in last 48h):`);

    recentUsers.forEach(u => {
        console.log(`   - ${u.name} (${u.plan_name}) -> Limit: ${u.daily_limit} | Active: ${u.is_active}`);
        if (u.plan_name !== 'none' && u.daily_limit === 0) {
            console.log("     ⚠️ WARNING: Plan purchased but Limit is 0!");
        }
    });
    console.log("---------------------------------------------------");

    // 4. MANAGER TEAM CHECK (Sample: Team Fire)
    const himanshuTeam = allUsers.filter(u => u.team_code === 'TEAMFIRE');
    const himanshuTotal = himanshuTeam.reduce((sum, u) => sum + (u.leads_today || 0), 0);
    console.log(`🔥 TEAM FIRE AGGREGATE CHECK:`);
    console.log(`   - Members: ${himanshuTeam.length}`);
    console.log(`   - Total Leads Today (Sum of Members): ${himanshuTotal}`);

    // Check if Manager ID exists for Team Fire
    const manager = allUsers.find(u => u.team_code === 'TEAMFIRE' && u.plan_name.includes('manager')); // Simplified check
    if (manager) {
        console.log(`   - Manager Name: ${manager.name}`);
    } else {
        console.log(`   - Manager Logic: Manual Check needed for Manager Dashboard`);
    }

    console.log("\n🏁 AUDIT COMPLETE.");
}

deepAudit();
