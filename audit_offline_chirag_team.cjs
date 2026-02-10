const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function auditChiragTeam() {
    console.log("🔍 Auditing Chirag's Team for OFFLINE users...");

    // 1. Find Chirag Manager IDs
    const { data: managers, error: mgrError } = await supabase
        .from('users')
        .select('id, name')
        .ilike('name', '%Chirag%');

    if (mgrError || !managers.length) {
        console.error("❌ Could not find manager 'Chirag'");
        return;
    }

    const managerIds = managers.map(m => m.id);
    console.log(`✅ Found manager IDs: ${managerIds.join(', ')}`);

    // 2. Find Offline Users under these managers
    const { data: offlineUsers, error: userError } = await supabase
        .from('users')
        .select('name, email, is_active, is_online, last_activity')
        .in('manager_id', managerIds)
        .eq('is_online', false) // Find those who are OFFLINE
        .eq('is_active', true);  // Only show those who have active plans

    if (userError) {
        console.error("❌ Error fetching users:", userError.message);
        return;
    }

    if (!offlineUsers.length) {
        console.log("🎉 All active members in Chirag's team are currently ONLINE!");
    } else {
        console.log(`⚠️ Found ${offlineUsers.length} OFFLINE members in Chirag's team:\n`);
        console.log("Name                      | Last Activity");
        console.log("--------------------------|---------------------");
        offlineUsers.forEach(u => {
            const lastActivity = u.last_activity ? new Date(u.last_activity).toLocaleString() : 'Never';
            console.log(`${u.name.padEnd(25)} | ${lastActivity}`);
        });
    }
}

auditChiragTeam();
