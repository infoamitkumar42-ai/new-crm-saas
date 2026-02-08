
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function syncChirag() {
    console.log("🔄 SYNCING COUNTERS FOR CHIRAG TEAM...");

    const today = new Date().toISOString().split('T')[0];

    const { data: users } = await supabase.from('users')
        .select('id, name, leads_today')
        .eq('team_code', 'GJ01TEAMFIRE')
        .eq('is_active', true);

    for (const u of users) {
        // Count actual leads in DB assigned today
        const { count } = await supabase.from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id)
            .gte('created_at', today + 'T00:00:00');

        if (count !== u.leads_today) {
            console.log(`   🛠️ Updating ${u.name}: ${u.leads_today} -> ${count}`);
            await supabase.from('users').update({ leads_today: count }).eq('id', u.id);
        }
    }
    console.log("✅ Done.");
}

syncChirag();
