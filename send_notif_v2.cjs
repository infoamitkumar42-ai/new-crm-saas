
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function blastNotif() {
    console.log("📢 Sending Corrected Notifications...");

    const today = new Date().toISOString().split('T')[0];

    // 1. Get Users who have count > 0 today
    const { data: users } = await supabase.from('users')
        .select('id, leads_today')
        .gt('leads_today', 0)
        .eq('is_active', true);

    if (!users) return;

    const payload = users.map(u => ({
        user_id: u.id,
        title: 'Dashboard Updated 🔄',
        message: `Your lead count is synced! You have ${u.leads_today} leads today. Pull to refresh.`, // Corrected Column Name
        type: 'system_alert'
    }));

    // 2. Send
    const { error } = await supabase.from('notifications').insert(payload);

    if (error) console.error("❌ Send Failed:", error.message);
    else console.log(`🎉 Notified ${users.length} users successfully.`);
}

blastNotif();
