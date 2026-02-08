const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkNotifiedUsers() {
    console.log("🔍 Fetching UNIQUE Users Notified TODAY (OTC)...");

    // Today Start
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // 1. Fetch Today's Notifications
    const { data: notifs, error } = await supabase
        .from('notifications')
        .select('user_id')
        .gte('created_at', todayISO);

    if (error) {
        console.error("❌ Error fetching notifications:", error.message);
        return;
    }

    // 2. Count by User
    const userCount = {};
    notifs.forEach(n => userCount[n.user_id] = (userCount[n.user_id] || 0) + 1);

    // 3. Fetch User Details
    const userIds = Object.keys(userCount);
    const { data: users } = await supabase.from('users').select('id, name, email').in('id', userIds);

    const userMap = {};
    users?.forEach(u => userMap[u.id] = { name: u.name, email: u.email });

    console.log(`📊 Total Users Notified: ${userIds.length}`);
    console.log(`📈 Details:`);

    Object.entries(userCount)
        .sort(([, a], [, b]) => b - a)
        .forEach(([uid, count]) => {
            const user = userMap[uid] || { name: 'Unknown User', email: 'N/A' };
            console.log(`- ${user.name} (${user.email}): ${count} Notifications`);
        });
}

checkNotifiedUsers();
