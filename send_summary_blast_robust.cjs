
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function sendBlastRobust() {
    console.log("📢 Sending Daily Summary Notification Blast (Robust)...");

    const { data: users } = await supabase.from('users')
        .select('id, name, leads_today')
        .gt('leads_today', 0)
        .eq('is_active', true);

    if (!users) return;

    console.log(`Sending to ${users.length} users...`);
    let count = 0;

    // Send in chunks of 10 to avoid timeouts/limits
    const chunkSize = 10;
    for (let i = 0; i < users.length; i += chunkSize) {
        const chunk = users.slice(i, i + chunkSize);

        const notifs = chunk.map(u => ({
            user_id: u.id,
            title: 'Daily Lead Summary 📊',
            message: `You have received ${u.leads_today} new leads today. Open CRM to start calling! 📞`,
            type: 'system_alert',
            created_at: new Date().toISOString()
        }));

        const { error } = await supabase.from('notifications').insert(notifs);
        if (error) console.error("Chunk Error:", error.message);
        else count += chunk.length;

        console.log(`Sent ${count}/${users.length}...`);
    }

    console.log("✅ Blast Complete.");
}

sendBlastRobust();
