const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    console.log("📊 Rajwinder Team - Total Leads Since Feb 3\n");

    // Find Rajwinder's team - check users with manager = Rajwinder or team code
    const { data: rajwinder } = await supabase.from('users')
        .select('id, name, team_code')
        .ilike('name', '%Rajwinder%');

    console.log("Rajwinder users found:", rajwinder?.map(u => `${u.name} (${u.team_code})`));

    // Get all unique team codes for Rajwinder
    const teamCodes = [...new Set(rajwinder?.map(u => u.team_code).filter(Boolean))];
    console.log("Team codes:", teamCodes);

    // Fetch all users in Rajwinder's team(s)
    let teamUsers = [];
    for (let tc of teamCodes) {
        const { data: users } = await supabase.from('users')
            .select('id, name, email, plan_name, is_active')
            .eq('team_code', tc);
        if (users) teamUsers = teamUsers.concat(users);
    }

    // Also check if there's a manager_id pattern
    if (rajwinder && rajwinder.length > 0) {
        const { data: managedUsers } = await supabase.from('users')
            .select('id, name, email, plan_name, is_active, team_code')
            .eq('manager_id', rajwinder[0].id);
        if (managedUsers && managedUsers.length > 0) {
            console.log(`\nUsers managed by Rajwinder (manager_id): ${managedUsers.length}`);
            // Add any that aren't already in teamUsers
            const existingIds = new Set(teamUsers.map(u => u.id));
            managedUsers.forEach(u => {
                if (!existingIds.has(u.id)) teamUsers.push(u);
            });
        }
    }

    console.log(`\nTotal Team Members: ${teamUsers.length}`);
    console.log(`Active: ${teamUsers.filter(u => u.is_active).length}`);
    console.log(`Inactive: ${teamUsers.filter(u => !u.is_active).length}`);

    // Count leads since Feb 3 for each user
    const sinceDate = '2026-02-03T00:00:00.000+05:30';
    let grandTotal = 0;

    console.log("\n--- Per User Leads (Since Feb 3) ---");
    for (let u of teamUsers) {
        const { count } = await supabase.from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id)
            .gte('created_at', sinceDate);

        const leads = count || 0;
        grandTotal += leads;
        if (leads > 0) {
            console.log(`  ${u.name} (${u.plan_name || 'N/A'}, ${u.is_active ? 'Active' : 'Inactive'}): ${leads} leads`);
        }
    }

    console.log(`\n🔥 TOTAL LEADS to Rajwinder's Team since Feb 3: ${grandTotal}`);
}

main().catch(console.error);
