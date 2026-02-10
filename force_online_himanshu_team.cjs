const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function forceOnlineHimanshuTeam() {
    const managerIds = [
        '9dd68ace-a5a7-46d8-b677-3483b5bb0841',
        '79c67296-b221-4ca9-a3a5-1611e690e68d'
    ];

    console.log(`🚀 Forcing ONLINE status for Paid Users in Himanshu's Team...`);

    // 1. Find target users (Paid & Offline)
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, payment_status, is_active, is_online')
        .in('manager_id', managerIds)
        .eq('payment_status', 'active')
        .eq('is_online', false);

    if (error) {
        console.error("❌ Error fetching users:", error.message);
        return;
    }

    if (users.length > 0) {
        console.log(`⚠️ Found ${users.length} PAID but OFFLINE users:`);
        users.forEach(u => console.log(`- ${u.name} (${u.email})`));

        // 2. Update them
        const userIds = users.map(u => u.id);
        const { error: updateError } = await supabase
            .from('users')
            .update({
                is_online: true,
                is_active: true, // Ensure plan is active too
                last_activity: new Date().toISOString() // Refresh activity
            })
            .in('id', userIds);

        if (updateError) {
            console.error("❌ Update Failed:", updateError.message);
        } else {
            console.log(`\n✅ SUCCESS! All ${users.length} users are now ONLINE & ACTIVE.`);
        }
    } else {
        console.log("✅ No paid users are currently offline. Everyone is active!");
    }

    // 3. Fetch Stats
    console.log("\n📊 CALCULATING TEAM STATS...");

    // Get all users for Himanshu
    const { data: allUsers } = await supabase
        .from('users')
        .select('id, name, leads_today, is_online, payment_status')
        .in('manager_id', managerIds);

    if (allUsers) {
        const totalMembers = allUsers.length;
        const receivers = allUsers.filter(u => u.leads_today > 0).length;
        const currentlyOnline = allUsers.filter(u => u.is_online).length;
        const paidActive = allUsers.filter(u => u.payment_status === 'active' && u.is_online).length;

        console.log(`- Total Members: ${totalMembers}`);
        console.log(`- Has Received Leads Today: ${receivers}`);
        console.log(`- Currently Online (Total): ${currentlyOnline}`);
        console.log(`- Paid & Active (Receiving Now): ${paidActive}`);
    }
}

forceOnlineHimanshuTeam();
