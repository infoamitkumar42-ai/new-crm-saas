const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function cleanupAndVerify() {
    console.log("🧹 Starting Final Cleanup & Resync...");

    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    // 1. Fetch all leads from today
    const { data: leads, error: leadErr } = await supabase
        .from('leads')
        .select('assigned_to')
        .gte('created_at', startOfDay.toISOString());

    if (leadErr) throw leadErr;

    // 2. Fetch all users
    const { data: users, error: userErr } = await supabase
        .from('users')
        .select('id, name, email, leads_today, daily_limit');

    if (userErr) throw userErr;

    console.log(`📊 Syncing ${users.length} users with actual lead counts...`);

    let syncCount = 0;
    for (const u of users) {
        const actualCount = leads.filter(l => l.assigned_to === u.id).length;

        if (u.leads_today !== actualCount) {
            await supabase.from('users').update({ leads_today: actualCount }).eq('id', u.id);
            syncCount++;
        }
    }

    console.log(`✅ Resynced ${syncCount} user counters.`);

    // 3. Final Check for Himanshu
    const { data: himanshu } = await supabase
        .from('users')
        .select('name, email, daily_limit, leads_today')
        .eq('email', 'sharmahimanshu9797@gmail.com')
        .single();

    console.log("\n👑 FINAL HIMANSHU STATUS:");
    console.log(JSON.stringify(himanshu, null, 2));

    console.log("\n🚀 SYSTEM RESTORED SUCCESSFULLY!");
}

cleanupAndVerify();
