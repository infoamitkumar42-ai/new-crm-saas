
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function syncAndNotify() {
    console.log("🔄 STARTING GLOBAL COUNTER SYNC & NOTIFICATION BLAST...\n");

    const today = new Date().toISOString().split('T')[0];

    // 1. Get All Active Users
    const { data: users } = await supabase.from('users')
        .select('id, name, leads_today')
        .gt('daily_limit', 0)
        .eq('is_active', true);

    if (!users) return console.log("No active users found.");
    console.log(`Checking ${users.length} users...`);

    let updatedCount = 0;
    const notificationPayload = [];

    for (const u of users) {
        // Count ACTUAL leads in DB
        const { count, error } = await supabase.from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id)
            .gte('created_at', today + 'T00:00:00');

        if (error) continue;

        const dbCount = count || 0;

        // If mismatch, fix it
        if (dbCount !== u.leads_today) {
            // console.log(`   🛠️ Fixing ${u.name}: ${u.leads_today} -> ${dbCount}`);

            await supabase.from('users')
                .update({ leads_today: dbCount })
                .eq('id', u.id);

            updatedCount++;
        }

        // Prepare Notification for EVERYONE (to refresh their dashboard)
        if (dbCount > 0) {
            notificationPayload.push({
                user_id: u.id,
                title: 'Dashboard Updated 🔄',
                body: `Your lead count is synced! You have ${dbCount} leads today. Pull to refresh.`,
                type: 'system_alert'
            });
        }
    }

    console.log(`\n✅ SYNC COMPLETE: Fixed counters for ${updatedCount} users.`);

    // 2. Send Massive Notification
    if (notificationPayload.length > 0) {
        console.log(`📢 Sending Notifications to ${notificationPayload.length} users...`);

        // Batch Insert Notifications
        const { error: notifErr } = await supabase.from('notifications')
            .insert(notificationPayload);

        if (notifErr) {
            console.error("❌ Notification Error:", notifErr.message);
        } else {
            console.log("🎉 NOTIFICATIONS SENT SUCCESSFULLY.");
        }
    }
}

syncAndNotify();
