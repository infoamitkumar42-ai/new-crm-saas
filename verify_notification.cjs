
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function verifyDashboardAndNotif() {
    console.log("🕵️‍♂️ Checking Dashboard Counts & Notifications...");

    // 1. Check Users we just assigned to (e.g. Happy sathwara, AJAY AHIR)
    const targetNames = ['Happy sathwara', 'AJAY AHIR', 'Parth Rami (Chirag sir)', 'Vaishali adesra'];

    const { data: users } = await supabase
        .from('users')
        .select('id, name, leads_today')
        .in('name', targetNames);

    console.log("\n📊 Dashboard Counters:");
    console.table(users);

    if (users.length > 0) {
        // 2. Check Notifications for these users
        const { data: notifs } = await supabase
            .from('notifications')
            .select('*')
            .in('user_id', users.map(u => u.id))
            .order('created_at', { ascending: false })
            .limit(10);

        console.log("\n🔔 Notifications Sent (Last 10):");
        if (notifs && notifs.length > 0) {
            console.table(notifs.map(n => ({
                User: users.find(u => u.id === n.user_id)?.name,
                Title: n.title,
                Message: n.message,
                Time: n.created_at
            })));
        } else {
            console.log("⚠️ No notifications found in DB table.");
            console.log("   (Note: Manual Insertion script might not trigger triggers unless specifically coded)");
        }
    }
}

verifyDashboardAndNotif();
