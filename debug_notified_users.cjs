const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkNotifiedUsersDebug() {
    console.log("🔍 Fetching UNIQUE Users Notified TODAY (DEBUG)...");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // 1. Fetch Today's Notifications
    const { data: notifs, error } = await supabase
        .from('notifications')
        .select('user_id')
        .gte('created_at', todayISO)
        .limit(5); // Just 5 to check

    if (error || !notifs || notifs.length === 0) {
        console.log("❌ No notifications or error:", error);
        return;
    }

    const userIds = notifs.map(n => n.user_id);
    console.log("🆔 Found User IDs:", userIds);

    // 2. Fetch Users
    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name')
        .in('id', userIds);

    if (usersError) {
        console.log("❌ Users fetch error:", usersError);
    } else {
        console.log("👤 Users Found:", users);
    }
}

checkNotifiedUsersDebug();
