const { createClient } = require('@supabase/supabase-js');
// require('dotenv').config();

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verifyNotifications() {
    console.log('🔍 verifying Lead Notifications for TODAY...');

    // 1. Get Assigned Leads Today
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const { data: leads, error: leadError } = await supabase
        .from('leads')
        .select('id, assigned_to, assigned_at, users!leads_assigned_to_fkey(name)')
        .gte('assigned_at', startOfDay.toISOString())
        .not('assigned_to', 'is', null)
        .order('assigned_at', { ascending: false });

    if (leadError) {
        console.error('❌ Lead Fetch Error:', leadError);
        return;
    }

    // 2. Get Notifications Today
    const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('user_id, created_at, type')
        .gte('created_at', startOfDay.toISOString())
        .in('type', ['lead_assigned', 'lead_arrived']);

    if (notifError) {
        console.error('❌ Notification Fetch Error:', notifError);
        return;
    }

    console.log(`📊 Found ${leads.length} leads assigned today.`);
    console.log(`🔔 Found ${notifications.length} notifications generated today.`);

    // 3. Match Logic
    let matched = 0;
    let missed = 0;
    const missedDetails = [];

    for (const lead of leads) {
        const leadTime = new Date(lead.assigned_at).getTime();

        // Check if there is a notification for this user around this time (+/- 2 mins)
        // Actually, notification should be AFTER lead assignment, usually within seconds.
        // Let's look for ANY notification within 5 minutes after assignment.

        const hasNotif = notifications.find(n => {
            if (n.user_id !== lead.assigned_to) return false;
            const notifTime = new Date(n.created_at).getTime();
            const diff = notifTime - leadTime;
            return diff >= -5000 && diff <= 300000; // -5s to +5 mins (allow slight clock skew)
        });

        if (hasNotif) {
            matched++;
        } else {
            missed++;
            missedDetails.push({
                lead_id: lead.id,
                user: lead.users?.name || 'Unknown',
                assigned_at: new Date(lead.assigned_at).toLocaleString()
            });
        }
    }

    console.log('\n🚀 VERIFICATION RESULTS:');
    console.log(`✅ Success Rate: ${((matched / leads.length) * 100).toFixed(1)}% (${matched}/${leads.length})`);
    console.log(`❌ Missed Notifications: ${missed}`);

    if (missed > 0) {
        console.log('\n⚠️ MISSED DETAILS (Samples):');
        missedDetails.slice(0, 10).forEach(m => console.log(`- ${m.user} at ${m.assigned_at} (Lead ID: ${m.lead_id})`));
    } else {
        console.log('🎉 PERFECT SCORE! All leads triggered notifications.');
    }

    // Check unique users notified vs unique users assigned
    const uniqueAssigned = new Set(leads.map(l => l.assigned_to));
    const uniqueNotified = new Set(notifications.map(n => n.user_id));

    console.log(`\n👥 Unique Users Assigned: ${uniqueAssigned.size}`);
    console.log(`🔔 Unique Users Notified: ${uniqueNotified.size}`);
}

verifyNotifications();
