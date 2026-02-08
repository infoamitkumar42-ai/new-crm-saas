
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function blastViaRPC() {
    console.log("📢 Sending Notification Blast via RPC...");

    // 1. Get Target Users
    const { data: users } = await supabase.from('users')
        .select('id, leads_today')
        .gt('leads_today', 0)
        .eq('is_active', true);

    if (!users || users.length === 0) {
        console.log("No users to notify.");
        return;
    }

    console.log(`Preparing notifications for ${users.length} users...`);

    // 2. Prepare Payload
    const payload = users.map(u => ({
        user_id: u.id,
        title: 'Daily Lead Summary 📊',
        message: `You have received ${u.leads_today} new leads today. Open CRM to start calling! 📞`,
        type: 'system_alert'
    }));

    // 3. Call RPC (Batch Insert)
    const { error } = await supabase.rpc('send_notification_blast', { payload: payload });

    if (error) {
        console.error("❌ RPC Failed:", error.message);
    } else {
        console.log(`✅ SUCCESS! Sent ${users.length} notifications instantly.`);
    }
}

blastViaRPC();
