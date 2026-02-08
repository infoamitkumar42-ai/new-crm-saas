
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkTriggers() {
    console.log("🕵️‍♂️ Converting Schema to JSON to find Triggers...");

    // Using RPC to query pg_trigger if possible, otherwise we test behavior
    // Since direct SQL access via client is limited without RPC 'execute_sql'
    // We will assume: If leads are assigned properly, notifications usually trigger via Edge Function or DB Trigger

    // Let's Insert a Dummy Lead and see if a Notification is created.
    const fakePhone = "8899" + Math.floor(Math.random() * 999999);

    // 1. Insert and let Trigger Assign it
    const { data: lead } = await supabase.from('leads').insert({
        name: 'Notif Test Lead',
        phone: fakePhone,
        source: 'CBO Notif Test', // Will hit TEAMFIRE safety net
        status: 'New'
    }).select().single();

    if (!lead || !lead.assigned_to) {
        console.log("❌ Lead Assign Failed during test.");
        return;
    }

    const userId = lead.assigned_to;
    console.log(`Lead Assigned to: ${userId}`);

    // 2. Check Notifications Table for this user in last 10 seconds
    await new Promise(r => setTimeout(r, 2000)); // Wait 2s

    const { data: notif } = await supabase.from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

    if (notif && notif.length > 0 && notif[0].message.includes('Notif Test Lead')) {
        console.log("✅ NOTIFICATION SYSTEM IS ACTIVE! (User got the alert)");
    } else {
        console.log("⚠️ WARNING: Lead Assigned but NO Notification found.");
        console.log("   (We might need to add Notification logic to the Safety Trigger)");
    }
}

checkTriggers();
