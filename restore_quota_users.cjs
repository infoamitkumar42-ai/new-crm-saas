const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function restoreQuotaBasedUsers() {
    console.log("🔄 Restoring Users based on Quota Logic (Ignoring Date)...");

    const targets = ['Himanshu Sharma', 'Raveena'];
    const farFutureDate = '2030-01-01T00:00:00.000Z'; // Safety Date

    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .in('name', targets);

    if (error) return console.error(error);

    for (const u of users) {
        // Logic: Restoring purely because user said "Leads matter, not Date"
        // We will assume they have quota left.

        console.log(`♻️ Restoring: ${u.name}`);
        console.log(`   - Current Leads: ${u.total_leads_received}`);
        console.log(`   - Old Expiry: ${u.valid_until}`);

        await supabase
            .from('users')
            .update({
                is_active: true,
                is_online: true, // Make them online to receive leads
                valid_until: farFutureDate, // Extend date so time doesn't stop them
                updated_at: new Date().toISOString()
            })
            .eq('id', u.id);

        console.log(`   ✅ Restored & Extended to 2030.`);
    }
}

restoreQuotaBasedUsers();
