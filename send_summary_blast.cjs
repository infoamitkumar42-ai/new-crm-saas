
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function sendBlast() {
    console.log("📢 Sending Daily Summary Notification Blast...");

    // 1. Get All Users with Leads > 0
    const { data: users } = await supabase.from('users')
        .select('id, name, leads_today')
        .gt('leads_today', 0)
        .eq('is_active', true);

    if (!users || users.length === 0) {
        console.log("No users with leads found.");
        return;
    }

    console.log(`Sending to ${users.length} users...`);

    let sentCount = 0;
    const notifications = [];

    for (const u of users) {
        notifications.push({
            user_id: u.id,
            title: 'Daily Lead Summary 📊',
            message: `You have received ${u.leads_today} new leads today. Open CRM to start calling! 📞`,
            type: 'system_alert',
            created_at: new Date().toISOString()
        });
        sentCount++;
    }

    // Batch Insert
    const { error } = await supabase.from('notifications').insert(notifications);

    if (error) console.error("❌ Send Failed:", error.message);
    else console.log(`✅ Successfully sent ${sentCount} notifications!`);
}

sendBlast();
