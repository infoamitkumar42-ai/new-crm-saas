
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function notifyVisibilityFix() {
    console.log("📢 ACKKNOWLEDGING FIX: Sending 'Refresh Now' Alert...");

    // Target Active Users who have leads > 0
    const { data: users } = await supabase.from('users')
        .select('id, name')
        .gt('daily_limit', 0)
        .eq('is_active', true);

    if (!users) return;

    const payload = users.map(u => ({
        user_id: u.id,
        title: 'Leads Visible Now! ✅',
        message: `Your dashboard leads are restored. Please PULL TO REFRESH to see your new leads.`,
        type: 'system_alert'
    }));

    const { error } = await supabase.from('notifications').insert(payload);

    if (error) console.error("❌ Failed:", error.message);
    else console.log(`✅ Alert sent to ${users.length} users.`);
}

notifyVisibilityFix();
