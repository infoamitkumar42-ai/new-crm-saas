
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function sendNotifs() {
    console.log("🚀 Sending Notifications for Imported Leads...");

    // 1. Get Today's Imported Leads
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const { data: leads } = await supabase.from('leads')
        .select('id, name, assigned_to')
        .eq('source', 'Digital Chirag Manual Import')
        .gte('created_at', startOfDay.toISOString());

    if (!leads || leads.length === 0) {
        console.log("None found.");
        return;
    }

    console.log(`Checking ${leads.length} leads...`);

    let nSent = 0;
    for (const l of leads) {
        if (!l.assigned_to) continue;

        // Check if notif already exists
        const { data: exist } = await supabase.from('notifications')
            .select('id')
            .eq('user_id', l.assigned_to)
            .ilike('message', `%${l.name}%`)
            .gte('created_at', startOfDay.toISOString());

        if (exist && exist.length > 0) continue;

        // Insert Notification
        await supabase.from('notifications').insert({
            user_id: l.assigned_to,
            title: 'New Lead Assigned! 🚀',
            message: `You have been assigned a new lead: ${l.name}. Call now!`,
            type: 'lead_assigned',
            created_at: new Date().toISOString()
        });
        nSent++;
    }

    console.log(`✅ Sent ${nSent} Notifications.`);
}

sendNotifs();
