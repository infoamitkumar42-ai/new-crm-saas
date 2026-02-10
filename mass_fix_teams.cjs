const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fixTeams() {
    console.log("🛠️ MASS FIX: Assigning Team Codes based on Manager...");

    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, manager_id')
        .is('team_code', null)
        .not('manager_id', 'is', null);

    if (error) {
        console.error(error);
        return;
    }

    if (users.length === 0) {
        console.log("✅ No users found matching criteria.");
        return;
    }

    console.log(`Processing ${users.length} users...`);

    for (const user of users) {
        // Fetch manager's team code
        const { data: manager } = await supabase
            .from('users')
            .select('team_code')
            .eq('id', user.manager_id)
            .single();

        if (manager && manager.team_code) {
            console.log(`🚀 Updating ${user.name} (${user.email}) -> Team: ${manager.team_code}`);

            const { error: updateError } = await supabase
                .from('users')
                .update({ team_code: manager.team_code })
                .eq('id', user.id);

            if (updateError) {
                console.error(`❌ Failed to update ${user.email}:`, updateError.message);
            }
        } else {
            console.log(`⚠️ Skip ${user.name}: Manager has no team_code.`);
        }
    }

    console.log("\n✅ Mass Fix Complete.");
}

fixTeams();
