const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function forceOnlineChiragTeam() {
    const managerIds = [
        '8c653bc9-eb28-45d7-b658-4b3694956171',
        '460e0444-25a8-4ac9-9260-ce21be97aab3',
        'aac2b76b-0794-49e2-a030-91711ab5ecff',
        'c4c71cbb-6000-4137-b72f-2c07be2179e7',
        'a98f9160-17e8-4eac-904c-0518705fa67c'
    ];

    console.log(`🚀 Forcing ONLINE status for Paid Users in Chirag's Team...`);

    // 1. Find target users
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

    if (users.length === 0) {
        console.log("✅ No paid users are currently offline. Everyone is ready!");
        return;
    }

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
        console.log("🚀 Leads will start distributing to them immediately.");
    }
}

forceOnlineChiragTeam();
