const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkTodayNotifications() {
    console.log("🔍 Checking Notifications for TODAY (OTC)...");

    // Today Start
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // 1. Fetch Today's Notifications
    const { data: notifs, error } = await supabase
        .from('notifications')
        .select('id, title, message, type, created_at, user_id')
        .gte('created_at', todayISO)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("❌ Error fetching notifications:", error.message);
        return;
    }

    console.log(`📊 Total Notifications Today: ${notifs.length}`);

    if (notifs.length === 0) {
        console.log("⚠️ No notifications found for today.");
        return;
    }

    // 2. Group by Type
    const byType = {};
    notifs.forEach(n => {
        byType[n.type] = (byType[n.type] || 0) + 1;
    });
    console.log("📈 Type Breakdown:", byType);

    // 3. Fetch User Names for latest 10
    const userIds = [...new Set(notifs.slice(0, 10).map(n => n.user_id))];
    const { data: users } = await supabase.from('users').select('id, name').in('id', userIds);
    const userMap = {};
    users?.forEach(u => userMap[u.id] = u.name);

    console.log("\n🕒 Latest 10 Notifications:");
    notifs.slice(0, 10).forEach(n => {
        const userName = userMap[n.user_id] || 'Unknown User';
        const time = new Date(n.created_at).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' });
        console.log(`- [${time}] To: ${userName} | ${n.title} | ${n.message}`);
    });
}

checkTodayNotifications();
