const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkTables() {
    console.log("🔍 Checking for Notification Tables...");

    // Try fetching from 'notifications'
    const { data: notifs, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .limit(5);

    if (!notifError) {
        console.log("✅ Table 'notifications' EXISTS!");
        console.log("Sample:", notifs);
    } else {
        console.log("❌ Table 'notifications' check failed:", notifError.message);
    }

    // Try 'communication_logs'
    const { data: logs, error: logsError } = await supabase
        .from('communication_logs')
        .select('*')
        .limit(5);

    if (!logsError) {
        console.log("✅ Table 'communication_logs' EXISTS!");
        console.log("Sample:", logs);
    } else {
        console.log("❌ Table 'communication_logs' check failed:", logsError.message);
    }

    // Try 'sent_notifications'
    const { data: sent, error: sentError } = await supabase
        .from('sent_notifications')
        .select('*')
        .limit(5);

    if (!sentError) {
        console.log("✅ Table 'sent_notifications' EXISTS!");
        console.log("Sample:", sent);
    } else {
        console.log("❌ Table 'sent_notifications' check failed:", sentError.message);
    }
}

checkTables();
